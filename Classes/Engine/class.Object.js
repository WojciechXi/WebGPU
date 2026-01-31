class Obj {

    static {
        this.objs = [];
    }

    constructor(data = {}, properties = {}) {
        const object = this;

        object.Property('hideFlags', {
            value: data.hideFlags ?? 0,
        });

        object.Property('name', {
            value: data.name ?? 'Object',
        });

        Object.keys(properties).forEach(function (property) {
            object.Property(property, properties[property]);
        });

        if (!object._instanceId) object._instanceId = Guid.New();

        object.Init();
    }
    Init() {
        Obj.objs.push(this);
    }

    Property(property, options = {}) {
        const object = this;
        object[`_${property}`] = options.value ?? null;

        const settings = {};

        if (options.get !== false) {
            if (options.get instanceof Function) settings.get = options.get;
            else settings.get = function () {
                return object[`_${property}`];
            }
        }

        if (options.set !== false) {
            if (options.set instanceof Function) settings.set = function (value) {
                object[`_${property}`] = options.set.call(object, value);
            };
            else settings.set = function () {
                object[`_${property}`] = value;
            }
        }

        Object.defineProperty(this, property, settings);
        if (options.set) object[property] = options.value;
    }

    // Public Methods
    GetInstanceID() { return this._instanceId; }
    GetType() { return this.constructor.name; }
    ToString() { return JSON.stringify(this); }

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