class Component extends Obj {

    constructor(gameObject) {
        super();
        this.tag = '';
        this.enabled = true;
        this.gameObject = gameObject;
        this.Init();
    }

    get transform() { return this.gameObject.transform; }

    Init() {

    }

    GetComponent(type) {
        return this.gameObject.GetComponent(type);
    }

}