
// Part of Enso
// Licensed under the MIT License, see LICENSE file in root.

// Framework internal key
export const ENSO_INTERNAL = Symbol("enso.internal");

// Enso Component internal framework method Symbols
export const SCHEDULE_UPDATE = Symbol("enso.scheduleUpdate");
export const SCHEDULE_EFFECT = Symbol("enso.scheduleEffect");
export const ATTACH_TEMPLATE = Symbol("enso.attachTemplates");
export const MARK_CHANGED = Symbol("enso.markChanged");
export const ADD_CHILD = Symbol("enso.addChild");
export const UPDATE = Symbol("enso.update");

// Enso Component internal framework property Symbols
export const GET_BINDING = Symbol("enso.getBinding");
export const TASK_LIST = Symbol("enso.taskList");
export const BINDINGS = Symbol("enso.bindings");
export const CHILDREN = Symbol("enso.children");
export const ROOT = Symbol("enso.root");
export const ENV = Symbol("enso.env");

// Watched and root node definition attributes
export const ENSO_NODE = 'data-enso-node';
export const ENSO_ROOT = 'data-enso-root';
