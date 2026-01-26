class Obj {

    static {
        this.objs = [];
    }

    constructor(data = {}) {
        this.hideFlags = 0;
        this.name = 'Object';

        this._instanceId = Guid.New();

        const object = this;
        Object.keys(data).forEach(function (key) { object[key] = data[key]; });
        this.Init();
    }
    Init() {
        Obj.objs.push(this);
    }

    // Public Methods
    GetInstanceID() { return this._instanceId; }
    GetType() { return this.constructor.name; }
    ToString() { return JSON.stringify(this); }

    Destroy() {
        Obj.objs.splice(Obj.objs.indexOf(object), 1);
    }

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
    static Instantiate(original) {
        const instance = new this({
            hideFlags: original.hideFlags,
            name: original.name,
        });

        return instance;
    }
    static InstantiateAsync(original) {

    }

}