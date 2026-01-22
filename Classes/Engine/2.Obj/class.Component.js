class Component extends Obj {

    // Properties
    get transform() { return this.gameObject.transform; }

    constructor(gameObject) {
        super();
        this.tag = '';
        this.enabled = true;
        this.gameObject = gameObject;
    }

    get enabled() { return this._enabled; }
    set enabled(value) {
        if (this._enabled === value) return;
        this._enabled = value;

        if (value) this.scene.AddComponent(this);
        else this.scene.RemoveComponent(this);
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