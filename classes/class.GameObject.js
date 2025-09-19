class GameObject extends Object {

    constructor(name = 'GameObject') {
        super();
        this.name = name;
        this.components = new Array();
        this.transform = this.AddComponent(Transform);
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
        for (component of this.components) component.Start();
        for (child of this.transform.children) child.Start();
    }

    Update() {
        for (component of this.components) component.Update();
        for (child of this.transform.children) child.Update();
    }

}