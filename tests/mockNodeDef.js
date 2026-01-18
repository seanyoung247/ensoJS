// tests/helpers/mockNodeDef.js
import { NodeDefMap } from '../src/templates/nodedef';

export function createNodeDef(node) {
  const map = new NodeDefMap();
  return map.create(node);
}
