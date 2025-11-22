
// Part of Enso
// Licensed under the MIT License, see LICENSE file in root.

const parseIdentifier = identifier => {
    if (identifier.includes(':')) {
        return parseIdentifier(identifier.split(':')[1]);
    }
    if (identifier.includes('=')) {
        return parseIdentifier(identifier.split('=')[0]);
    }
    return identifier.trim();
};
// Parsers the item portion of the for value to get the 
// required top level item identifiers.
const getIdentifiers = source => {
    const brackets = { '{':'}', '[':']', '}':'{', ']':'[' };
    const stack = [{token:'', capturing: true}];
    let allowCapture = true;
    
    const openBracket = token => {
        const capturing = stack.at(-1).capturing && allowCapture;
        stack.push({ token: brackets[token], capturing });
        allowCapture = true;
    };
    const closeBracket = token => {
        if (token !== stack.pop().token) throw new Error('mismatched brackets');
        allowCapture = false;
    };
    const nonCapturing = {
        ',': () => { allowCapture = true; },
        '{': openBracket, '[': openBracket,
        '}': closeBracket, ']': closeBracket,
    };

    return source.split(/([{}[\],])/).map(token => {
        if (!token?.trim()) return;
        if (nonCapturing[token]) return nonCapturing[token](token);
        
        if (stack.at(-1).capturing) {
            allowCapture = false;
            if (token.trim().at(-1) === ':') allowCapture = true;
            return parseIdentifier(token);
        }
        
    }).filter(Boolean);
};
// Parses a For Value, i.e. (item of list, member in object etc)
// and returns the list and item identifier.
export const parseFor = source => {
    const [item, ] = source.split(/\b(?:of|in)\b(?!.*\b(of|in)\b)/).filter(Boolean);
    const identifiers = getIdentifiers(item);
    return identifiers;
};

// Returns a function that iterates using the for code value
export const createForFunction = (code, ids) => (
    /*js*/
    `(function* () {
        try {
            for (const ${ code }) {
                yield { ${ ids.join(', ')} };
            }
        } catch(e) {
            console.error('Runtime error in for loop:', e);
        }
    }).bind(this);/*js*/`
);
