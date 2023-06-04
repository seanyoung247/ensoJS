
export const domHandler = {

    get: function(target, prop) {
        // Indicate object is already wrapped by a proxy
        if (prop === '_isProxy') return true;

        console.log(`Getting: ${prop}`);

        if (typeof target[prop] === 'object' && !target[prop]._isProxy) {
            target[prop] = new Proxy(obj[prop], domHandler());
        }
        return target[prop];
    },

    set: function (target, prop, value) {
        console.log(`Setting: ${prop}`);

        if (target[prop] === value) return true;
        target[prop] = value;

        return true;
    },

    apply: function (target, self, args) {
        console.log(`Calling: ${args}`);
        return Reflect.apply(target, self, args);
    }

}