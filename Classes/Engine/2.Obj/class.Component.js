class Component extends Obj {

    constructor(data = {}, properties = {}) {
        super(data, {
            ...properties,
            gameObject: {
                value: data._gameObject ?? data.gameObject ?? null,
                set: false,
            },
            tag: {
                get: function () { return this.gameObject.tag },
                set: false,
            },
            scene: {
                get: function () { return this.gameObject.scene },
                set: false,
            },
            transform: {
                get: function () { return this.gameObject.transform },
                set: false,
            },
            enabled: {
                value: data._enabled ?? data.enabled ?? true,
                set: function (value) {
                    if (this._enabled === value) value;

                    if (this.scene) {
                        if (value) {
                            this.scene.AddComponent(this);
                            if (this.OnEnable) this.OnEnable();
                        } else {
                            this.scene.RemoveComponent(this);
                            if (this.OnDisable) this.OnDisable();
                        }
                    }

                    return value;
                },
            }
        });
    }

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

    static Instantiate(original, gameObject) {
        const instance = new (original.constructor)({
            ...original,
            _gameObject: gameObject,
        });

        gameObject.components.push(instance);

        return instance;
    }

}