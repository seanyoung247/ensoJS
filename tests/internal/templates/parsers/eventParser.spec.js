// Part of Enso
// Licensed under the MIT License, see LICENSE file in root.

import { describe, it, expect, vi, beforeAll } from 'vitest';

// Mock the parser module before importing the parser
vi.mock('../../../../src/templates/parser.js', () => {
    return {
        parser: {
            registerAttr: vi.fn()
        }
    };
});

// Mock dependencies used by the parser
vi.mock('../../../../src/templates/parsers/utils.js', () => ({
    bindSource: vi.fn(value => value),
    getName: vi.fn(attr => attr.name.slice(1)), // remove "@" prefix
    isAttr: vi.fn((attr, prefix) => attr.name.startsWith(prefix))
}));

// Mock Action class
vi.mock('../../../../src/core/effects.js', () => {
    // define the mock class inside the factory
    return {
        Action: class {
            constructor(source) {
                this.source = source;
                this.createFunc = vi.fn(() => () => {});
            }
        }
    };
});

// Import the parser (it will call registerAttr on our mock)
import '../../../../src/templates/parsers/eventParser.js';
import { parser } from '../../../../src/templates/parser.js';
import { bindSource, getName, isAttr } from '../../../../src/templates/parsers/utils.js';
import { Action } from '../../../../src/core/effects.js';
import { getTestElement } from "../../../shared.js";

describe('@event parser', () => {
    let eventParser;

    beforeAll(() => {
        // Grab the parser object from the call to registerAttr
        expect(parser.registerAttr).toHaveBeenCalledTimes(1);
        eventParser = parser.registerAttr.mock.calls[0][0];
        expect(eventParser.type).toBe('event');
    });

    it('match() works correctly', () => {
        const el = document.createElement('div');
        expect(eventParser.match(el, { name: '@click' })).toBe(true);
        expect(isAttr).toHaveBeenCalledWith({ name: '@click' }, '@', 'evt');
    });

    it('preprocess() adds an event and removes the attribute', () => {
        const el = getTestElement('@click', 'handlerFunc');
        const attr = el.getAttributeNode('@click');

        const def = { addEvent: vi.fn(), attachParser: vi.fn() };

        const result = eventParser.preprocess(def, el, attr);

        expect(result).toBe(true);
        expect(bindSource).toHaveBeenCalledWith(attr.value);
        expect(getName).toHaveBeenCalledWith(attr);
        expect(def.addEvent).toHaveBeenCalled();
        expect(def.attachParser).toHaveBeenCalledWith(eventParser);
        expect(el.hasAttribute('@click')).toBe(false);
    });

    it('process() attaches event listeners', () => {
        const element = document.createElement('div');
        const parent = { component: {}, events: [{ name: 'click', action: new Action('handlerFunc') }] };

        const def = { events: parent.events };

        eventParser.process(def, parent, element);

        const clickEvent = new Event('click');
        element.dispatchEvent(clickEvent);

        // ensure createFunc was called
        expect(parent.events[0].action.createFunc).toHaveBeenCalledWith(parent);
    });

    it('Handles invalid handler functions gracefully', () => {
        const element = document.createElement('div');
        const parent = { component: {}, events: [
            { name: 'click', action: {createFunc() { throw new Error("boom"); }} }
        ]};

        const def = { events: parent.events };

        const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
        const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

        eventParser.process(def, parent, element);

        expect(consoleErrorSpy).toHaveBeenCalled();

        const clickEvent = new Event('click');
        element.dispatchEvent(clickEvent);

        expect(consoleWarnSpy).toHaveBeenCalledWith(
            "[Enso] Invalid handler for event 'click'"
        );

        consoleWarnSpy.mockRestore();
        consoleErrorSpy.mockRestore();
    });

    it('process() does nothing when no events are defined', () => {
        const element = document.createElement('div');
        const parent = { component: {} };

        const def = {};

        // Should not throw, should not attempt to attach events
        expect(() => eventParser.process(def, parent, element)).not.toThrow();
    });

    it('process() does nothing when events is an empty array', () => {
        const element = document.createElement('div');
        const parent = { component: {} };

        const def = { events: [] };

        expect(() => eventParser.process(def, parent, element)).not.toThrow();
    });

});
