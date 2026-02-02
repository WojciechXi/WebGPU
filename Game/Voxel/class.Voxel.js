class Voxel {

    constructor(blockId = 0, iso = 0, light = 0) {
        this.blockId = blockId;
        this.iso = iso;
        this.light = light;
    }

    get isSolid() {
        return this.blockId && this.iso >= 0.5;
    }

    toString() { return JSON.stringify(this); }

}