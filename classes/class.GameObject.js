class GameObject extends Obj {

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
        for (let component of (this.components)) component.Start();
        for (let child of (this.transform.children)) child.gameObject.Start();
    }

    Update() {
        for (let component of (this.components)) component.Update();
        for (let child of (this.transform.children)) child.gameObject.Update();
    }

    PreRender() {
        for (let component of (this.components)) component.PreRender();
        for (let child of (this.transform.children)) child.gameObject.PreRender();
    }

    Render() {
        for (let component of (this.components)) component.Render();
        for (let child of (this.transform.children)) child.gameObject.Render();
    }

    PostRender() {
        for (let component of (this.components)) component.PostRender();
        for (let child of (this.transform.children)) child.gameObject.PostRender();
    }

}