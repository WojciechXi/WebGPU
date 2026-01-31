class Scene extends Obj {

    constructor(data = {}, parameters = {}) {
        super(data, {
            ...parameters,
            renderSettings: {
                value: data._renderSettings ?? data.renderSettings ?? new RenderSettings(),
                set: false,
            },
        });
    }

    Init() {
        this.gameObjects = [];
        this.fixedUpdateables = [];
        this.updateables = [];
        this.renderables = [];
        this.ambientLight = null;
        this.directionalLight = null;
        this.directionalLights = [];
        this.colliders = [];
        this.cameras = [];
        this.gizmos = [];
    }

    AddGameObject(gameObject) {
        this.gameObjects.push(gameObject);
    }

    RemoveGameObject(gameObject) {
        this.gameObjects.splice(this.gameObjects.indexOf(gameObject), 1);
    }

    AddComponent(component) {
        if (component.FixedUpdate) this.fixedUpdateables.push(component);
        if (component.Update) this.updateables.push(component);
        if (component.OnDraw) this.renderables.push(component);
        if (component.OnDrawGizmos) this.gizmos.push(component);
        if (component instanceof DirectionalLight) this.directionalLights.push(component);
        if (component instanceof Collider) this.colliders.push(component);
        if (component instanceof Camera) this.cameras.push(component);
    }

    RemoveComponent(component) {
        if (component.FixedUpdate) this.fixedUpdateables.splice(this.fixedUpdateables.indexOf(component), 1);
        if (component.Update) this.updateables.splice(this.updateables.indexOf(component), 1);
        if (component.OnDraw) this.renderables.splice(this.renderables.indexOf(component), 1);
        if (component.OnDrawGizmos) this.gizmos.splice(this.gizmos.indexOf(component), 1);
        if (component instanceof DirectionalLight) this.directionalLights.splice(this.cameras.indexOf(component), 1);
        if (component instanceof Collider) this.colliders.splice(this.colliders.indexOf(component), 1);
        if (component instanceof Camera) this.cameras.splice(this.cameras.indexOf(component), 1);
    }

}