class AnimationPath extends Obj {

    constructor() {
        super();
        const object = this;

        new Property(object, 'joint', -1);
        new Property(object, 'path', '');
        new Property(object, 'times', []);
        new Property(object, 'values', []);
    }

}