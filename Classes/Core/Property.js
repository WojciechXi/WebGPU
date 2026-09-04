class Property {

    constructor(target, propertyKey, defaultValue = null, options = {}) {
        const object = this;
        object.target = target;
        object.value = null;

        Object.defineProperty(target, propertyKey, {
            get: function () {
                if (options.get) return options.get();
                return object.value;
            },
            set: function (value) {
                if (options.set) value = options.set(value, object.value);
                object.value = value;
                if (options.assigned) options.assigned(value);
            },
        });

        target[propertyKey] = defaultValue;
    }

}