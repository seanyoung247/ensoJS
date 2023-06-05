
export const domHandler = {

    get: function(target, prop) {
        // Indicate object is already wrapped by a proxy
        if (prop === '_isProxy') return true;

        if (typeof target[prop] === 'object' && !target[prop]._isProxy) {
            target[prop] = new Proxy(target[prop], domHandler);
        }
        return target[prop];
    },

    set: function (target, prop, value) {

        if (target[prop] === value) return true;
        target[prop] = value;

        return true;
    },

    apply: function (target, self, args) {
        return Reflect.apply(target, self, args);
    }

}