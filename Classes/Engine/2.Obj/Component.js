class Component extends Obj {

    constructor() {
        super();
        const object = this;

        new Property(object, 'gameObject', null);
        new Property(object, 'tag', 'Default');
    }

    get scene() { return this.gameObject ? this.gameObject.scene : null; }
    get transform() { return this.gameObject ? this.gameObject.transform : null; }

    // Properties

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

    toJSON() {
        return {
            ...super.toJSON(),
            _gameObject: new ObjectReference(0, this.gameObject.GetInstanceID(), ObjectReferenceType.GameObject),
        };
    }

    static Instantiate(original, gameObject) {
        const instance = new (original.constructor)({
            ...original,
            _gameObject: gameObject,
        });

        gameObject.components.push(instance);

        return instance;
    }

}