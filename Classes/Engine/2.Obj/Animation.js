class Animation extends Obj {

    constructor() {
        super();
        const object = this;
        new Property(object, 'animationPaths', []);
    }

}