class Skin extends Obj {

    constructor() {
        super();
        const object = this;

        new Property(object, 'joints', []);
        new Property(object, 'jointPaths', []);
        new Property(object, 'inverseBindMatrices', []);
    }

}