class Scene extends Obj {

    Init() {
        this.gameObjects = [];
        this.updateables = [];
        this.renderables = [];
        this.cameras = [];
    }

    AddGameObject(gameObject) {
        this.gameObjects.push(gameObject);
    }

    RemoveGameObject(gameObject) {
        this.gameObjects.splice(this.gameObjects.indexOf(gameObject), 1);
    }

    AddComponent(component) {
        if (component.Update) this.updateables.push(component);
        if (component.Draw) this.renderables.push(component);
        if (component instanceof Camera) this.cameras.push(component);
    }

    RemoveComponent(component) {
        if (component.Update) this.updateables.splice(this.updateables.indexOf(component), 1);
        if (component.Draw) this.renderables.splice(this.renderables.indexOf(component), 1);
        if (component instanceof Camera) this.cameras.splice(this.cameras.indexOf(component), 1);
    }

}