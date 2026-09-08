class Obj {

    static {
        this.objs = [];
    }

    static Make(properties = {}) {
        const object = this;
        const instance = new object();
        Object.keys(properties).forEach(function (property) { instance[property] = properties[property]; });
        return instance;
    }

    static _nextId = 0;

    constructor() {
        const object = this;

        new Property(object, 'name', object.constructor.name);
        new Property(object, 'instanceID', Obj._nextId++);
        new Property(object, 'hideFlags', 0);

        Obj.objs.push(this);
    }

    // Public Methods
    GetInstanceID() { return this.instanceID; }
    GetType() { return this.constructor.name; }
    ToString() { return JSON.stringify(this); }
    toJSON() {
        return {
            type: this.constructor.name,
            instanceID: this.instanceID,
            hideFlags: this.hideFlags,
            name: this.name,
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
    static Instantiate(original) { return new original.constructor.Make(original); }
    static InstantiateAsync(original) { }

}