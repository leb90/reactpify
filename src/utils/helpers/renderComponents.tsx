import React from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { Provider } from 'react-redux';
import { store } from '../../redux';

type ComponentProps = Record<string, unknown>;
type ComponentType = React.ComponentType<ComponentProps>;

interface ComponentRegistry {
  [key: string]: ComponentType;
}

interface MountedInstance {
  root: Root;
  mountNode: HTMLElement;
}

const componentRegistry: ComponentRegistry = {};
const mountedInstances = new WeakMap<HTMLElement, MountedInstance>();

const COMPONENT_ROOT_SELECTOR = '[data-component-root]';
const SECTION_DATA_SELECTOR = 'script[type="application/json"][data-section-data]';
const MOUNT_NODE_CLASS = 'reactpify-root';

const isDevelopment = import.meta.env.DEV;

function logDebug(...args: unknown[]): void {
  if (isDevelopment) {
    console.log('[reactpify]', ...args);
  }
}

function logError(...args: unknown[]): void {
  console.error('[reactpify]', ...args);
}

export function registerComponent(name: string, component: ComponentType): void {
  componentRegistry[name] = component;
  logDebug(`component registered: ${name}`);
}

export function getComponentRegistry(): ComponentRegistry {
  return { ...componentRegistry };
}

function snakeToCamel(key: string): string {
  return key.replace(/_([a-z0-9])/g, (_, char: string) => char.toUpperCase());
}

function camelizeKeys(source: ComponentProps): ComponentProps {
  return Object.fromEntries(
    Object.entries(source).map(([key, value]) => [snakeToCamel(key), value])
  );
}

type PayloadResult =
  | { status: 'ok'; props: ComponentProps }
  | { status: 'missing' }
  | { status: 'invalid' };

function parseJson(raw: string | null, context: string): PayloadResult {
  if (!raw || !raw.trim()) return { status: 'missing' };

  try {
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed === 'object' && parsed !== null) {
      return { status: 'ok', props: parsed as ComponentProps };
    }

    logError(`JSON in ${context} is not an object`);
    return { status: 'invalid' };
  } catch (error) {
    logError(`invalid JSON in ${context}:`, error);
    return { status: 'invalid' };
  }
}

function findOwnDataPayload(container: HTMLElement): PayloadResult {
  const script = container.querySelector<HTMLScriptElement>(SECTION_DATA_SELECTOR);

  if (script && script.closest(COMPONENT_ROOT_SELECTOR) === container) {
    return parseJson(script.textContent, 'data-section-data script');
  }

  return parseJson(container.getAttribute('data-section-data'), 'data-section-data attribute');
}

function extractProps(container: HTMLElement): PayloadResult {
  const payload = findOwnDataPayload(container);
  if (payload.status !== 'ok') return payload;

  const settings = payload.props.settings;
  const source =
    typeof settings === 'object' && settings !== null
      ? (settings as ComponentProps)
      : payload.props;

  return { status: 'ok', props: camelizeKeys(source) };
}

interface ErrorBoundaryProps {
  componentName: string;
  children: React.ReactNode;
}

class ComponentErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  { hasError: boolean }
> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    logError(`component "${this.props.componentName}" crashed:`, error);
  }

  render() {
    if (this.state.hasError) {
      return isDevelopment ? (
        <div className="reactpify-error">
          Component &quot;{this.props.componentName}&quot; failed to render.
        </div>
      ) : null;
    }

    return this.props.children;
  }
}

function hideFallback(container: HTMLElement): void {
  container
    .querySelectorAll<HTMLElement>('[data-fallback]')
    .forEach((fallback) => {
      if (fallback.closest(COMPONENT_ROOT_SELECTOR) === container) {
        fallback.hidden = true;
      }
    });
}

function showFallback(container: HTMLElement): void {
  container
    .querySelectorAll<HTMLElement>('[data-fallback]')
    .forEach((fallback) => {
      fallback.hidden = false;
    });
}

function createMountNode(container: HTMLElement): HTMLElement {
  const mountNode = document.createElement('div');
  mountNode.className = MOUNT_NODE_CLASS;
  container.appendChild(mountNode);
  return mountNode;
}

function renderError(container: HTMLElement, message: string): void {
  if (!isDevelopment) return;

  const notice = document.createElement('div');
  notice.className = 'reactpify-error';
  notice.textContent = message;
  container.appendChild(notice);
}

export function mountComponent(container: HTMLElement): void {
  if (mountedInstances.has(container)) return;

  const componentName = container.getAttribute('data-component-root');

  if (!componentName) {
    logError(
      'a [data-component-root] element has no component name. ' +
        'Use data-component-root="ComponentName".',
      container
    );
    return;
  }

  const Component = componentRegistry[componentName];

  if (!Component) {
    logError(
      `component "${componentName}" is not registered. ` +
        `Registered components: ${Object.keys(componentRegistry).join(', ') || 'none'}`
    );
    renderError(container, `Reactpify: component "${componentName}" not found`);
    return;
  }

  const payload = extractProps(container);

  if (payload.status === 'invalid') {
    logError(
      `component "${componentName}" kept its Liquid fallback because the section data is not valid JSON`
    );
    return;
  }

  const props = payload.status === 'ok' ? payload.props : {};
  const mountNode = createMountNode(container);
  const root = createRoot(mountNode);

  mountedInstances.set(container, { root, mountNode });
  container.classList.add('reactpify-hydrated');
  hideFallback(container);

  root.render(
    <Provider store={store}>
      <ComponentErrorBoundary componentName={componentName}>
        <Component {...props} />
      </ComponentErrorBoundary>
    </Provider>
  );

  container.dispatchEvent(
    new CustomEvent('reactpify:hydrated', {
      bubbles: true,
      detail: { componentName, props }
    })
  );

  logDebug(`mounted ${componentName}`, props);
}

export function unmountComponent(container: HTMLElement): void {
  const instance = mountedInstances.get(container);
  if (!instance) return;

  instance.root.unmount();
  instance.mountNode.remove();
  mountedInstances.delete(container);

  container.classList.remove('reactpify-hydrated');
  showFallback(container);

  logDebug('unmounted', container.getAttribute('data-component-root'));
}

function mountWithin(scope: ParentNode): void {
  scope
    .querySelectorAll<HTMLElement>(COMPONENT_ROOT_SELECTOR)
    .forEach(mountComponent);
}

function unmountWithin(scope: ParentNode): void {
  scope
    .querySelectorAll<HTMLElement>(COMPONENT_ROOT_SELECTOR)
    .forEach(unmountComponent);
}

function scanDocument(): void {
  mountWithin(document);
}

function watchDynamicContent(): void {
  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        if (!(node instanceof HTMLElement)) continue;

        if (node.matches(COMPONENT_ROOT_SELECTOR)) {
          mountComponent(node);
        }

        mountWithin(node);
      }
    }
  });

  observer.observe(document.body, { childList: true, subtree: true });
}

function listenToThemeEditor(): void {
  document.addEventListener('shopify:section:load', (event) => {
    const target = (event as CustomEvent).target;
    if (target instanceof HTMLElement) mountWithin(target);
  });

  document.addEventListener('shopify:section:unload', (event) => {
    const target = (event as CustomEvent).target;
    if (target instanceof HTMLElement) unmountWithin(target);
  });
}

function isDebugRequested(): boolean {
  try {
    return (
      new URLSearchParams(window.location.search).has('reactpify-debug') ||
      window.localStorage.getItem('reactpify-debug') === 'true'
    );
  } catch {
    return false;
  }
}

function exposeDebugApi(): void {
  Object.defineProperty(window, 'reactpify', {
    value: {
      registry: getComponentRegistry,
      refresh: scanDocument,
      mount: mountComponent,
      unmount: unmountComponent
    },
    configurable: true
  });
}

let isInitialized = false;

export function initRenderSystem(): void {
  if (isInitialized) return;
  isInitialized = true;

  const start = () => {
    const debugEnabled = isDebugRequested();

    if (debugEnabled) {
      document.documentElement.setAttribute('data-reactpify-debug', 'true');
    }

    scanDocument();
    watchDynamicContent();
    listenToThemeEditor();
    window.addEventListener('reactpify:refresh', scanDocument);

    if (isDevelopment || debugEnabled) exposeDebugApi();

    logDebug(
      `render system ready with ${Object.keys(componentRegistry).length} component(s)`,
      Object.keys(componentRegistry)
    );
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start, { once: true });
  } else {
    start();
  }
}
