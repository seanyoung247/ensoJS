
/*!
 * Enso v1.0.0
 * Copyright (c) 2025 Sean Young
 * Licensed under the MIT License
 */

// Enso Internal
import { API } from "./core/api.js";

//// EXPORTS
export const Enso = Object.freeze(API);

// Template tags
export { css, html } from './core/tags.js';
// Lifecycle identifies
export { lifecycle } from './component.js';
// Watched properties
export { 
    prop, attr, watches, 
    getWatched, setWatched 
} from './core/watched.js';

// Component creator and global settings - Retained for compatibility
export default Enso;
