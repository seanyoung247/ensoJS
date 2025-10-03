
// Part of Enso
// Licensed under the MIT License, see LICENSE file in root.

const proxies = new WeakMap();

const baseWatcher = (onChange, name) => ({
    get(target, prop, receiver) {
        const value = Reflect.get(target, prop, receiver);

        if (typeof value === 'object' && value !== null) {
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
});

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
                }
            }
            return base.get(target, prop, receiver);
        }
    }
}

const typeMap = {
    'Array': new Set(['push','pop','shift','unshift','splice','sort','reverse']),
    'Set': new Set(['add','delete','clear']),
    'Map': new Set(['set','delete','clear']),
}

const getWatcher = (target, name, onChange) => {
    if (Array.isArray(target)) return mutatorWatcher(onChange, name, typeMap.Array);
    if (target instanceof Set) return mutatorWatcher(onChange, name, typeMap.Set);
    if (target instanceof Map) return mutatorWatcher(onChange, name, typeMap.Map);
    return baseWatcher(onChange, name);
}

export const watch = (target, name, onChange) => {
    if (typeof target !== 'object' || target === null) return target;
  
    if (proxies.has(target)) return proxies.get(target);
  
    const watcher = getWatcher(target, name, onChange);
    const proxy = new Proxy(target, watcher);
    proxies.set(target, proxy);
    return proxy;
}
