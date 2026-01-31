class Skin extends Obj {

    constructor(name) {
        super({
            _name: name,
        }, {
            joints: { value: [] },
            jointPaths: { value: [] },
            inverseBindMatrices: { value: [] },
        });
    }

}