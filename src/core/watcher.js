
// Part of Enso
// Licensed under the MIT License, see LICENSE file in root.

const proxies = new WeakMap();


const baseWatcher = (onChange, name) => ({
    get(target, prop, receiver) {
        const value = Reflect.get(target, prop, receiver);

        if (typeof value === 'object' && value !== null &&(value)) {
            return watch(value, name, onChange);
        }
        return value;
    },

    set(target, prop, value, receiver) {
        const oldValue = target[prop];
        const result = Reflect.set(target, prop, value, receiver);

        if (oldValue !== value) {
            onChange(name);
        }

        return result;
    },

    deleteProperty(target, prop) {
        const hadKey = Object.prototype.hasOwnProperty.call(target, prop);
        const result = Reflect.deleteProperty(target, prop);

        if (hadKey && result) {
            onChange(name);
        }

        return result;
    },
});

const iterators = ['values','entries','keys', Symbol.iterator];
const isIterator = (target, prop) => (
    typeof target[prop] === 'function' && 
    iterators.includes(prop)
);

const mutatorWatcher = (onChange, name, trapMethods) => {
    const base = baseWatcher(onChange, name);
    
    return {
        ...base,
        get(target, prop, receiver) {
            const value = Reflect.get(target, prop, receiver);
            if (typeof value === 'function' && trapMethods.has(prop)) {
                return (...args) => {
                    const result = value.apply(target, args);
                    onChange(name);
                    return result;
                };
            }

            // For iteration methods (values, entries, keys, Symbol.iterator), 
            // return the original function bound to target
            if (isIterator(target, prop)) {
                return target[prop].bind(target);
            }

            return base.get(target, prop, receiver);
        }
    };
};

const typeMap = {
    'Array': new Set(['push','pop','shift','unshift','splice','sort','reverse']),
    'Set': new Set(['add','delete','clear']),
    'Map': new Set(['set','delete','clear']),
};

const getWatcher = (target, name, onChange) => {
    if (Array.isArray(target)) return mutatorWatcher(onChange, name, typeMap.Array);
    if (target instanceof Set) return mutatorWatcher(onChange, name, typeMap.Set);
    if (target instanceof Map) return mutatorWatcher(onChange, name, typeMap.Map);
    return baseWatcher(onChange, name);
};

export const watch = (target, name, onChange) => {
    if (typeof target !== 'object' || target === null) return target;
  
    if (proxies.has(target)) return proxies.get(target);
  
    const watcher = getWatcher(target, name, onChange);
    const proxy = new Proxy(target, watcher);
    proxies.set(target, proxy);
    return proxy;
};
