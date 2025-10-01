class VoxelChunkData {

    static {
        this.resolution = 16;
        this.area = parseInt(Math.pow(this.resolution, 2));
        this.volume = parseInt(Math.pow(this.resolution, 3));
    }

    static Index(x, y, z) {
        let index = (this.resolution * this.resolution * z) + (this.resolution * y) + x;
        return index >= 0 && index < this.volume ? index : -1;
    }

    constructor() {
        this.voxels = new Uint16Array(VoxelChunkData.volume);
    }

}