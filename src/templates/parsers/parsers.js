
// Part of Enso
// Licensed under the MIT License, see LICENSE file in root.

import eventParser from './eventParser.js';
import textParser from './textParser.js';
import attrParser from './attrParser.js';
import propParser from './propParser.js';
import refParser from './refParser.js';
import forParser from './forParser.js';
import ifParser from './ifParser.js';

export function registerParsers(parser) {
    eventParser(parser);
    textParser(parser);
    attrParser(parser);
    propParser(parser);
    refParser(parser);
    forParser(parser);
    ifParser(parser);
}
