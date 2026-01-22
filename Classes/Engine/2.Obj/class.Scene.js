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

    AddComponent(component) {
        if (component.Update) this.updateables.push(component);
        if (component.Draw) this.renderables.push(component);
        if (component instanceof Camera) this.cameras.push(component);
    }

    RemoveComponent(component) {
        //Remove from lists
    }

}