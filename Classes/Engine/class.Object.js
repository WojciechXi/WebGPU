class Obj {

    static {
        this.objs = [];
    }


    constructor(data = {}) {
        const object = this;
        Object.keys(data).forEach(function (key) { object[key] = data[key]; });
        this.Init();
    }
    Init() {
        Obj.objs.push(this);
        this._instanceId = Guid.New();
    }

    /* Unity */

    // Properties
    get hideFlags() { return this._hideFlags; } set hideFlags(value) { return this._hideFlags = value; }
    get name() { return this._name; } set name(value) { return this._name = value; }

    // Public Methods
    GetInstanceID() { return this._instanceId; }
    GetType() { return this.constructor.name; }
    ToString() { return JSON.stringify(this); }

    // Static Methods
    static Destroy(object) {
        this.objs.splice(this.objs.indexOf(object), 1);
    }
    static DestroyImmediate(object) {
        this.objs.splice(this.objs.indexOf(object), 1);

    }
    static DontDestroyOnLoad() { }
    static FindAnyObjectByType() { }
    static FindFirstObjectByType() { }
    static FindObjectsByType() { }
    static Instantiate(original) {

    }
    static InstantiateAsync(original) {

    }

}