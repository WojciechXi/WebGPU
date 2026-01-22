class GameObject extends Obj {

    constructor(name = 'GameObject', parent = null) {
        super();

        this.scene = Engine.Instance.scene;
        this.scene.AddGameObject(this);

        this.name = name;
        this.components = new Array();
        this.transform = this.AddComponent(Transform);

        this.transform.SetParent(parent ?? (Engine.Instance.scene ? Engine.Instance.scene.transform : null));

        this.transformValues = new Float32Array(16);
        this.transformBuffer = GPU.CreateBuffer({
            size: this.transformValues.length * 4,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        });

        this.transformBindGroup = GPU.CreateBindGroup({
            layout: Graphics.transformBindGroupLayout,
            entries: [
                { binding: 0, resource: { buffer: this.transformBuffer } },
            ],
        });
    }

    GetComponent(type) { return this.components.find(function (c) { return c instanceof type }); }
    AddComponent(type) {
        let component = new type(this);
        this.components.push(component);

        if (component.Awake) component.Awake();
        return component;
    }

    Start() {
        for (let component of (this.components)) if (component.Start) component.Start();
        for (let child of (this.transform.children)) child.gameObject.Start();
    }

    Update() {
        this.transformValues.set(this.transform.matrix4x4, 0);
        GPU.Queue.writeBuffer(this.transformBuffer, 0, this.transformValues);

        for (let component of (this.components)) if (component.Update) component.Update();
        for (let child of (this.transform.children)) child.gameObject.Update();
    }

    PreRender() {
        for (let component of (this.components)) if (component.PreRender) component.PreRender();
        for (let child of (this.transform.children)) child.gameObject.PreRender();
    }

    Render(renderPass) {
        for (let component of (this.components)) if (component.Render) component.Render(renderPass);
        for (let child of (this.transform.children)) child.gameObject.Render(renderPass);
    }

    PostRender() {
        for (let component of (this.components)) if (component.PostRender) component.PostRender();
        for (let child of (this.transform.children)) child.gameObject.PostRender();
    }

}