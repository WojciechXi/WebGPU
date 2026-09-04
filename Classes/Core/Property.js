class Property {

    constructor(target, propertyKey, defaultValue = null, options = {}) {
        const object = this;
        object.target = target;
        object.value = defaultValue;
        Object.defineProperty(target, propertyKey, {
            writable: true,
            get: function () {
                if (options.get) return options.get();
                return object.value;
            },
            set: function (value) {
                if (options.set) return object.value = options.set(value);
                return object.value = value;
            },
        });
    }

}