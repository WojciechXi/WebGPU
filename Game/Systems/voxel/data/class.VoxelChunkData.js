class VoxelChunkData {

    static {
        this.resolution = 32;
        this.area = parseInt(Math.pow(this.resolution, 2));
        this.volume = parseInt(Math.pow(this.resolution, 3));
    }

    static Index(x, y, z) {
        if (x < 0 || y < 0 || z < 0) return -1;
        if (x >= VoxelChunkData.resolution || y >= VoxelChunkData.resolution || z >= VoxelChunkData.resolution) return -1;
        return (this.resolution * this.resolution * z) + (this.resolution * y) + x;
    }

    constructor() {
        this.voxels = new Uint16Array(VoxelChunkData.volume);
    }

}