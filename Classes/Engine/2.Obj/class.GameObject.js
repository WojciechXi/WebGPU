class GameObject extends Obj {

    get TransformType() { return Transform; }

    get activeInHierarchy() { return this.parent ? this.activeSelf && this.parent.activeInHierarchy : this.activeSelf; }
    get activeSelf() { return this._activeSelf; }
    get transform() { return this._transform; }
    get transformHandle() { }

    constructor(name = 'GameObject', scene = Engine.Instance.scene, ...components) {
        super({
            name: name,
        });

        if (scene) {
            this.scene = scene;
            this.scene.AddGameObject(this);
        }

        this.layer = 0;
        this.isStatic = false;

        this.sceneCullingMask = 0;
        this.tag = '';

        this.components = new Array();

        this._transform = this.AddComponent(this.TransformType);
        for (let component of components) this.AddComponent(component);

        this._activeSelf = true;
    }

    AddComponent(type) {
        let component = new type(this);
        this.components.push(component);

        if (component.Awake) component.Awake();
        return component;
    }
    BroadcastMessage(methodName, ...parameters) {
        if (!this.activeInHierarchy) return;
        for (const component of this.components) if (component.enabled && component[methodName]) component[methodName].call(component[methodName], ...parameters);
        for (const child of this.transform.children) child.gameObject.BroadcastMessage(methodName, ...parameters);
    }
    CompareTag(tag) { return this.tag == tag; }
    GetComponent(type) { return this.components.find(function (c) { return c instanceof type }); }
    GetComponentAtIndex(index) { return this.components[index]; }
    GetComponentCount() { return this.components.length; }
    GetComponentInChildren(type, includeInactive = false) {
        let component = this.components.find(c => c instanceof type && c.enabled || includeInactive);
        for (const child of this.transform.children) if (component = child.gameObject.GetComponentInChildren(type, includeInactive)) return component;
        return null;
    }
    GetComponentIndex(component) { return this.components.indexOf(component); }
    GetComponentInParent(type, includeInactive = false) {
        let component = this.components.find(c => c instanceof type && c.enabled || includeInactive);
        if (this.transform.parent) if (component = this.transform.parent.gameObject.GetComponentInParent(type, includeInactive)) return component;
        return null;
    }
    GetComponents(type) { return this.components.filter(c => c instanceof type); }
    GetComponentsInChildren(type, includeInactive = true) { }
    GetComponentsInParent(type, includeInactive = true) { }
    SendMessage(methodName, ...parameters) {
        if (!this.activeInHierarchy) return;
        for (const component of this.components) if (component.enabled && component[methodName]) component[methodName].call(component[methodName], ...parameters);
    }
    SendMessageUpwards(methodName, ...parameters) {
        if (!this.activeInHierarchy) return;
        for (const component of this.components) if (component.enabled && component[methodName]) component[methodName].call(component[methodName], ...parameters);
        if (this.transform.parent) this.transform.parent.gameObject.SendMessageUpwards(methodName, ...parameters);
    }
    SetActive(value) {
        this._activeSelf = value;
        //set enabled components
    }
    TryGetComponent(type) { return this.components.find(function (c) { return c instanceof type }); }

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
        for (let component of original.components) {
            Debug.Log(component.constructor.Instantiate(component, instance));
        }

        if (parent) instance.transform.SetParent(parent);
        if (position) instance.transform.position = position;
        if (rotation) instance.transform.rotation = rotation;

        for (let child of original.transform.children) this.Instantiate(child.gameObject, child.position, child.rotation, instance.transform);

        return instance;
    }

}