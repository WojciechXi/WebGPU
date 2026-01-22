class Component extends Obj {

    // Properties
    get transform() { return this.gameObject.transform; }
    get scene() { return this.gameObject.scene; }

    constructor(gameObject) {
        super();
        this.tag = '';
        this.gameObject = gameObject;

        this.enabled = true;
    }

    get enabled() { return this._enabled; }
    set enabled(value) {
        if (this._enabled === value) return;
        this._enabled = value;

        if (value) {
            this.scene.AddComponent(this);
            if (this.OnEnable) this.OnEnable();
        }
        else {
            this.scene.RemoveComponent(this);
            if (this.OnDisable) this.OnDisable();
        }
    }

    // Public Methods
    BroadcastMessage() { }
    CompareTag() { }
    GetComponent(type) { return this.gameObject.GetComponent(type); }
    GetComponentInChildren() { }
    GetComponentIndex() { }
    GetComponentInParent() { }
    GetComponents() { }
    GetComponentsInChildren() { }
    GetComponentsInParent() { }
    SendMessage() { }
    SendMessageUpwards() { }
    TryGetComponent() { }

}