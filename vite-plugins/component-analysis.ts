import ts from 'typescript';
import { readFileSync } from 'fs';
import { basename, dirname } from 'path';

export type PropKind = 'string' | 'number' | 'boolean' | 'select' | 'unknown';

export type PropDefault = string | number | boolean;

export interface ComponentProp {
  name: string;
  optional: boolean;
  kind: PropKind;
  options: string[];
  defaultValue?: PropDefault;
}

export interface ComponentAnalysis {
  componentName: string;
  props: ComponentProp[];
}

interface ComponentDeclaration {
  name: string;
  parameter?: ts.ParameterDeclaration;
  propsTypeNode?: ts.TypeNode;
}

function startsWithUppercase(name: string): boolean {
  return /^[A-Z]/.test(name);
}

function hasExportModifier(node: ts.Node): boolean {
  return (
    ts.canHaveModifiers(node) &&
    (ts.getModifiers(node) ?? []).some(
      (modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword
    )
  );
}

function getFunctionLike(
  node: ts.Expression | undefined
): ts.ArrowFunction | ts.FunctionExpression | undefined {
  if (!node) return undefined;

  if (ts.isArrowFunction(node) || ts.isFunctionExpression(node)) return node;

  if (ts.isCallExpression(node)) {
    return getFunctionLike(node.arguments[0]);
  }

  return undefined;
}

function readVariableComponent(
  statement: ts.VariableStatement
): ComponentDeclaration | undefined {
  for (const declaration of statement.declarationList.declarations) {
    if (!ts.isIdentifier(declaration.name)) continue;
    if (!startsWithUppercase(declaration.name.text)) continue;

    const fn = getFunctionLike(declaration.initializer);
    if (!fn) continue;

    const annotatedProps =
      declaration.type && ts.isTypeReferenceNode(declaration.type)
        ? declaration.type.typeArguments?.[0]
        : undefined;

    return {
      name: declaration.name.text,
      parameter: fn.parameters[0],
      propsTypeNode: annotatedProps ?? fn.parameters[0]?.type
    };
  }

  return undefined;
}

function readFunctionComponent(
  statement: ts.FunctionDeclaration
): ComponentDeclaration | undefined {
  if (!statement.name || !startsWithUppercase(statement.name.text)) return undefined;

  return {
    name: statement.name.text,
    parameter: statement.parameters[0],
    propsTypeNode: statement.parameters[0]?.type
  };
}

function findComponentDeclaration(
  sourceFile: ts.SourceFile
): ComponentDeclaration | undefined {
  const exported: ComponentDeclaration[] = [];
  const local: ComponentDeclaration[] = [];

  for (const statement of sourceFile.statements) {
    let declaration: ComponentDeclaration | undefined;

    if (ts.isVariableStatement(statement)) {
      declaration = readVariableComponent(statement);
    } else if (ts.isFunctionDeclaration(statement)) {
      declaration = readFunctionComponent(statement);
    }

    if (!declaration) continue;

    (hasExportModifier(statement) ? exported : local).push(declaration);
  }

  return exported[0] ?? local[0];
}

function findTypeMembers(
  sourceFile: ts.SourceFile,
  typeNode: ts.TypeNode | undefined
): ts.NodeArray<ts.TypeElement> | undefined {
  if (!typeNode) return undefined;

  if (ts.isTypeLiteralNode(typeNode)) return typeNode.members;

  if (!ts.isTypeReferenceNode(typeNode) || !ts.isIdentifier(typeNode.typeName)) {
    return undefined;
  }

  const typeName = typeNode.typeName.text;

  for (const statement of sourceFile.statements) {
    if (ts.isInterfaceDeclaration(statement) && statement.name.text === typeName) {
      return statement.members;
    }

    if (
      ts.isTypeAliasDeclaration(statement) &&
      statement.name.text === typeName &&
      ts.isTypeLiteralNode(statement.type)
    ) {
      return statement.type.members;
    }
  }

  return undefined;
}

function unwrapNullableUnion(typeNode: ts.TypeNode): ts.TypeNode[] {
  if (!ts.isUnionTypeNode(typeNode)) return [typeNode];

  return typeNode.types.filter((member) => {
    if (member.kind === ts.SyntaxKind.UndefinedKeyword) return false;
    if (member.kind === ts.SyntaxKind.NullKeyword) return false;
    if (ts.isLiteralTypeNode(member) && member.literal.kind === ts.SyntaxKind.NullKeyword) {
      return false;
    }
    return true;
  });
}

function readStringLiteralOptions(members: ts.TypeNode[]): string[] {
  const options: string[] = [];

  for (const member of members) {
    if (!ts.isLiteralTypeNode(member) || !ts.isStringLiteral(member.literal)) {
      return [];
    }
    options.push(member.literal.text);
  }

  return options;
}

function classifyType(typeNode: ts.TypeNode | undefined): {
  kind: PropKind;
  options: string[];
} {
  if (!typeNode) return { kind: 'unknown', options: [] };

  const members = unwrapNullableUnion(typeNode);

  if (members.length > 1) {
    const options = readStringLiteralOptions(members);
    if (options.length > 1) return { kind: 'select', options };
    return { kind: 'unknown', options: [] };
  }

  const [single] = members;
  if (!single) return { kind: 'unknown', options: [] };

  switch (single.kind) {
    case ts.SyntaxKind.StringKeyword:
      return { kind: 'string', options: [] };
    case ts.SyntaxKind.NumberKeyword:
      return { kind: 'number', options: [] };
    case ts.SyntaxKind.BooleanKeyword:
      return { kind: 'boolean', options: [] };
    default:
      break;
  }

  if (ts.isLiteralTypeNode(single) && ts.isStringLiteral(single.literal)) {
    return { kind: 'select', options: [single.literal.text] };
  }

  return { kind: 'unknown', options: [] };
}

function readLiteralValue(node: ts.Expression | undefined): PropDefault | undefined {
  if (!node) return undefined;

  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) {
    return node.text;
  }

  if (ts.isNumericLiteral(node)) return Number(node.text);

  if (node.kind === ts.SyntaxKind.TrueKeyword) return true;
  if (node.kind === ts.SyntaxKind.FalseKeyword) return false;

  if (ts.isPrefixUnaryExpression(node) && node.operator === ts.SyntaxKind.MinusToken) {
    const operand = readLiteralValue(node.operand);
    return typeof operand === 'number' ? -operand : undefined;
  }

  return undefined;
}

function readDefaults(parameter: ts.ParameterDeclaration | undefined): Map<string, PropDefault> {
  const defaults = new Map<string, PropDefault>();

  if (!parameter || !ts.isObjectBindingPattern(parameter.name)) return defaults;

  for (const element of parameter.name.elements) {
    const source = element.propertyName ?? element.name;
    if (!ts.isIdentifier(source)) continue;

    const value = readLiteralValue(element.initializer);
    if (value !== undefined) defaults.set(source.text, value);
  }

  return defaults;
}

function fallbackComponentName(filePath: string): string {
  const fileName = basename(filePath, '.tsx');
  if (startsWithUppercase(fileName)) return fileName;

  const folderName = basename(dirname(filePath));
  return folderName.replace(/(^|[-_])([a-z])/g, (_, __, char: string) => char.toUpperCase());
}

export function analyzeComponentSource(
  filePath: string,
  content: string
): ComponentAnalysis {
  const sourceFile = ts.createSourceFile(
    filePath,
    content,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX
  );

  const declaration = findComponentDeclaration(sourceFile);
  const componentName = declaration?.name ?? fallbackComponentName(filePath);
  const members = findTypeMembers(sourceFile, declaration?.propsTypeNode);
  const defaults = readDefaults(declaration?.parameter);
  const props: ComponentProp[] = [];

  for (const member of members ?? []) {
    if (!ts.isPropertySignature(member)) continue;
    if (!ts.isIdentifier(member.name) && !ts.isStringLiteral(member.name)) continue;

    const name = member.name.text;
    const { kind, options } = classifyType(member.type);
    const defaultValue = defaults.get(name);

    props.push({
      name,
      optional: Boolean(member.questionToken),
      kind: kind === 'unknown' && typeof defaultValue === 'boolean' ? 'boolean' : kind,
      options,
      defaultValue
    });
  }

  return { componentName, props };
}

export function analyzeComponentFile(filePath: string): ComponentAnalysis {
  return analyzeComponentSource(filePath, readFileSync(filePath, 'utf-8'));
}
