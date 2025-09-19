class Component extends Object {

    constructor(gameObject) {
        super();
        this.gameObject = gameObject;
        this.Init();
    }

    get transform() { return this.gameObject.transform; }

    Init() {

    }

}