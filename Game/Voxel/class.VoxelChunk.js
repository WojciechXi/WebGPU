class VoxelChunk {

    constructor() {
        this.voxels = new Array((VoxelResolution + 1) ** 3);
    }

    GetIndex(localPosition) {
        const size = VoxelResolution + 1;

        const x = Mathf.FloorToInt(localPosition.x);
        const y = Mathf.FloorToInt(localPosition.y);
        const z = Mathf.FloorToInt(localPosition.z);

        return parseInt(x + y * size + z * size * size);
    }

    GetVoxel(localPosition) {
        let index = this.GetIndex(localPosition);
        return this.voxels[index];
    }

}