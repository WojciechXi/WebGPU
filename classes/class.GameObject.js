class GameObject extends Object {

    constructor(name = 'GameObject', parent = null) {
        super();

        this.name = name;
        this.components = new Array();
        this.transform = this.AddComponent(Transform);

        this.transform.SetParent(parent ?? (Engine.Instance.scene ? Engine.Instance.scene.transform : null));
    }

    GetComponent(type) {
        return this.components.find(function (c) { return c instanceof type });
    }

    AddComponent(type) {
        let component = new type(this);
        this.components.push(component);
        return component;
    }

    Start() {
        for (let component of this.components) component.Start();
        for (let child of (this.transform.children)) child.Start();
    }

    Update() {
        for (let component of this.components) component.Update();
        for (let child of (this.transform.children)) child.Update();
    }

}