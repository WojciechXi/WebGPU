class GameObject extends Obj {

    constructor(name = 'GameObject', parent = null) {
        super();

        this.scene = Engine.Instance.scene;
        this.scene.AddGameObject(this);

        this.name = name;
        this.components = new Array();
        this.transform = this.AddComponent(Transform);

        this.transform.SetParent(parent ?? (Engine.Instance.scene ? Engine.Instance.scene.transform : null));
    }

    GetComponent(type) { return this.components.find(function (c) { return c instanceof type }); }
    AddComponent(type) {
        let component = new type(this);
        this.components.push(component);

        if (component.Awake) component.Awake();
        return component;
    }

}