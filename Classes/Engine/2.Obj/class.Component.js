class Component extends Obj {

    // Properties

    constructor(gameObject) {
        super({
            gameObject: gameObject,
        });

        this.enabled = true;
    }

    get tag() { return this.gameObject.tag; }
    get transform() { return this.gameObject.transform; }
    get scene() { return this.gameObject.scene; }

    get enabled() { return this._enabled; }
    set enabled(value) {
        if (this._enabled === value) return;
        this._enabled = value;

        if (this.scene) {
            if (value) {
                this.scene.AddComponent(this);
                if (this.OnEnable) this.OnEnable();
            } else {
                this.scene.RemoveComponent(this);
                if (this.OnDisable) this.OnDisable();
            }
        }
    }

    // Public Methods
    AddComponent(type) { return this.gameObject.AddComponent(type); }
    BroadcastMessage(methodName, ...parameters) { return this.gameObject.BroadcastMessage(methodName, ...parameters); }
    CompareTag(tag) { return this.gameObject.CompareTag(tag); }
    GetComponent(type) { return this.gameObject.GetComponent(type); }
    GetComponentInChildren(type, includeInactive = false) { return this.gameObject.GetComponentInChildren(type, includeInactive); }
    GetComponentIndex(component) { return this.gameObject.GetComponentIndex(component); }
    GetComponentInParent(type, includeInactive = false) { return this.gameObject.GetComponentInParent(type, includeInactive); }
    GetComponents(type) { return this.gameObject.GetComponents(type); }
    GetComponentsInChildren(type, includeInactive = true) { return this.gameObject.GetComponentsInChildren(type, includeInactive); }
    GetComponentsInParent(type, includeInactive = true) { return this.gameObject.GetComponentsInParent(type, includeInactive); }
    SendMessage(methodName, ...parameters) { return this.gameObject.SendMessage(methodName, ...parameters); }
    SendMessageUpwards(methodName, ...parameters) { return this.gameObject.SendMessageUpwards(methodName, ...parameters); }
    TryGetComponent(type) { return this.gameObject.TryGetComponent(type); }

}