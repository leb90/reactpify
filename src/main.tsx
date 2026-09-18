import './styles/index.css';
import { registerComponent, initRenderSystem } from './utils/helpers/renderComponents';

import { Test } from './components/test/Test';

registerComponent('Test', Test);

initRenderSystem();

export { getComponentRegistry } from './utils/helpers/renderComponents';
