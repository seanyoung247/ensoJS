
// Part of Enso
// Licensed under the MIT License, see LICENSE file in root.

export const UUIDRegEx = /^[A-Za-z0-9_-]{6}$/;

export const nextFrame = () => new Promise(resolve => requestAnimationFrame(resolve));