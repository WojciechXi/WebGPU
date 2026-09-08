class GameObject extends Obj {

    get TransformType() { return Transform; }

    get activeInHierarchy() { return this.isActive && (this.parent ? this.parent.activeInHierarchy : true); }
    get transformHandle() { }

    constructor(name = 'GameObject', scene = Engine.Instance.scene, ...components) {
        super();
        const object = this;

        object.name = name;

        new Property(object, 'components', []);
        new Property(object, 'layer', 0);
        new Property(object, 'tag', 'Default');
        new Property(object, 'isStatic', false);
        new Property(object, 'isActive', true);
        new Property(object, 'sceneCullingMask', 0);
        new Property(object, 'scene', scene, {
            set: function (value, oldValue) {
                if (value) value.AddGameObject(object);
                return value;
            },
        });
        new Property(object, 'transform', object.AddComponent(object.TransformType));

        for (let component of components) object.AddComponent(component);
    }

    AddComponent(type) {
        let component = new type();
        this.components.push(component);

        component.gameObject = this;
        component.enabled = true;

        if (this.scene) this.scene.AddComponent(component);

        if (component.OnEnable) component.OnEnable();
        if (component.Awake) component.Awake();

        return component;
    }
    BroadcastMessage(methodName, ...parameters) {
        if (!this.activeInHierarchy) return;
        for (const component of this.components) if (component && component[methodName]) component[methodName].call(component[methodName], ...parameters);
        for (const child of this.transform.children) child.gameObject.BroadcastMessage(methodName, ...parameters);
    }
    CompareTag(tag) { return this.tag == tag; }
    GetComponent(type) { return this.components.find(function (c) { return c instanceof type }); }
    GetComponentAtIndex(index) { return this.components[index]; }
    GetComponentCount() { return this.components.length; }
    GetComponentInChildren(type, includeInactive = false) {
        let component = this.components.find(c => c instanceof type && c || includeInactive);
        for (const child of this.transform.children) if (component = child.gameObject.GetComponentInChildren(type, includeInactive)) return component;
        return null;
    }
    GetComponentIndex(component) { return this.components.indexOf(component); }
    GetComponentInParent(type, includeInactive = false) {
        let component = this.components.find(c => c instanceof type && c || includeInactive);
        if (this.transform.parent) if (component = this.transform.parent.gameObject.GetComponentInParent(type, includeInactive)) return component;
        return null;
    }
    GetComponents(type) { return this.components.filter(c => c instanceof type); }
    GetComponentsInChildren(type, includeInactive = true) { }
    GetComponentsInParent(type, includeInactive = true) { }
    SendMessage(methodName, ...parameters) {
        if (!this.activeInHierarchy) return;
        for (const component of this.components) if (component && component[methodName]) component[methodName].call(component[methodName], ...parameters);
    }
    SendMessageUpwards(methodName, ...parameters) {
        if (!this.activeInHierarchy) return;
        for (const component of this.components) if (component && component[methodName]) component[methodName].call(component[methodName], ...parameters);
        if (this.transform.parent) this.transform.parent.gameObject.SendMessageUpwards(methodName, ...parameters);
    }
    SetActive(value) {
        this._isActive = value;
        //set enabled components
    }
    TryGetComponent(type) { return this.components.find(function (c) { return c instanceof type }); }

    toJSON() {
        const object = this;
        return {
            ...super.toJSON(),
            _components: object.components.map(c => new ObjectReference(0, c.GetInstanceID(), ObjectReferenceType.Component)),
        };
    }

    // Static Methods
    static CreatePrimitive() { }
    static Find() { }
    static FindGameObjectsWithTag() { }
    static FindWithTag() { }
    static GetScene() { return this.scene; }
    static InstantiateGameObjects() { }
    static SetGameObjectsActive() { }

    // Inherited Members
    // Static Methods
    static Instantiate(original, position = null, rotation = null, parent = null) {
        const instance = new this(original.name, Engine.Instance.scene);

        if (parent) instance.transform.SetParent(parent);
        for (let child of original.transform.children) this.Instantiate(child.gameObject, child.localPosition, child.localRotation, instance.transform);
        if (rotation) instance.transform.localRotation = rotation;
        if (position) instance.transform.localPosition = position;

        for (let component of original.components) {
            if (component instanceof Transform) continue;
            component.constructor.Instantiate(component, instance);
        }

        return instance;
    }

}