class VoxelChunkData {

    static {
        this.resolution = 16;
        this.area = parseInt(Math.pow(this.resolution, 2));
        this.volume = parseInt(Math.pow(this.resolution, 3));
    }

    constructor() {
        this.voxels = new Uint16Array(VoxelChunkData.volume);
    }

}