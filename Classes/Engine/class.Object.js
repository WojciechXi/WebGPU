class Obj {

    static {
        this.objs = [];
    }

    constructor(data = {}, properties = {}) {
        const object = this;

        object.Property('instanceID', { value: data._instanceID ?? Guid.New(), set: false, get: false });
        object.Property('name', { value: data._name ?? object.constructor.name });
        object.Property('hideFlags', { value: data._hideFlags ?? 0 });

        Object.keys(properties).forEach(function (property) {
            object.Property(property, properties[property]);
        });

        object.Init();
    }
    Init() {
        Obj.objs.push(this);
    }

    Property(property, options = {}) {
        const object = this;
        const propertyName = `_${property}`;

        let container = null;
        if (options.serialize !== false) object[propertyName] = container;

        const settings = {};

        if (options.get !== false) {
            if (options.get instanceof Function) settings.get = options.get;
            else settings.get = function () {
                return options.serialize !== false ? object[propertyName] : container;
            }
        }

        if (options.set !== false) {
            if (options.set instanceof Function) settings.set = function (value) {
                if (options.serialize !== false) object[propertyName] = options.set.call(object, value);
                else container = options.set.call(object, value);
            };
            else settings.set = function (value) {
                if (options.serialize !== false) object[propertyName] = value;
                else container = value;
            }
        }

        Object.defineProperty(this, property, settings);
        if (settings.set) {
            settings.set(options.value ?? null);
        } else {
            if (options.serialize !== false) object[propertyName] = options.value ?? null;
            else container = options.value ?? null;
        }
    }

    // Public Methods
    GetInstanceID() { return this._instanceID; }
    GetType() { return this.constructor.name; }
    ToString() { return JSON.stringify(this); }
    toJSON() {
        return {
            type: this.constructor.name,
            _instanceID: this._instanceID,
            _hideFlags: this._hideFlags,
            _name: this._name,
        };
    }

    Destroy() { Obj.objs.splice(Obj.objs.indexOf(object), 1); }

    // Static Methods
    static Destroy(object, timeout = 0) {
        if (timeout) return setTimeout(function () {
            object.Destroy();
        }, timeout * 1000);

        return object.Destroy();
    }
    static DestroyImmediate(object, allowDestroyingAssets = false) {
        return object.Destroy();

    }
    static DontDestroyOnLoad(target) { }
    static FindAnyObjectByType(type, findObjectsInactive = true) { return Obj.objs.filter(o => o instanceof type); }
    static FindFirstObjectByType(type, findObjectsInactive = true) { return Obj.objs.find(o => o.constructor == type); }
    static FindObjectsByType(type, findObjectsInactive = true, sortMode = false) { return Obj.objs.find(o => o.constructor == type); }
    static Instantiate(original) { return new (original.constructor)(original); }
    static InstantiateAsync(original) { }

}