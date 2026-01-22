class Component extends Obj {

    // Properties
    get transform() { return this.gameObject.transform; }

    constructor(gameObject) {
        super();
        this.tag = '';
        this.enabled = true;
        this.gameObject = gameObject;
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