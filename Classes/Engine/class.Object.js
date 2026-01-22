class Obj {

    constructor() {
        this.Init();
    }
    Init() { }

    /* Unity */

    // Properties
    get hideFlags() { return this._hideFlags; } set hideFlags(value) { return this._hideFlags = value; }
    get name() { return this._name; } set name(value) { return this._name = value; }

    // Public Methods
    GetInstanceID() { }
    ToString() { return JSON.stringify(this); }

    // Static Methods
    static Destroy() { }
    static DestroyImmediate() { }
    static DontDestroyOnLoad() { }
    static FindAnyObjectByType() { }
    static FindFirstObjectByType() { }
    static FindObjectsByType() { }
    static Instantiate() { }
    static InstantiateAsync() { }

}