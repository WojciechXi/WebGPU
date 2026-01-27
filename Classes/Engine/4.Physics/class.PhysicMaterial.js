class PhysicMaterial extends Obj {

    static get Default() {
        return this.default ?? (this.default = new PhysicMaterial());
    }

    Init() {
        this.bounceCombine = 0;
        this.bounciness = 0;
        this.dynamicFriction = 0;
        this.frictionCombine = 0;
        this.staticFriction = 0;
    }

}