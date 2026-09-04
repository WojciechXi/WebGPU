class Asset extends Obj {

    constructor() {
        super();
        const object = this;

        new Property(object, 'gameObject', null);
        new Property(object, 'animations', []);
        new Property(object, 'materials', []);
        new Property(object, 'textures', []);
        new Property(object, 'meshes', []);
        new Property(object, 'skins', []);
    }

}