class VoxelWorldComponent extends MonoBehaviour {

    OnEnable() {
        VoxelWorldComponent.Instance = this;

        this.voxelGPU = this.GetComponent(VoxelGPU);
        this.camera = Camera.main;
        this.material = null;

        this.position = this.transform.position;
        this.lastPosition = null;
        this.radius = 1;

        this.chunks = new Map();
    }

    IsSolid(position) {
        let voxel = this.GetVoxel(position);
        return voxel ? voxel.isSolid : false;
    }

    GetVoxel(position) {
        const chunkPosition = Vector3.Divide(position, 16).Floor();
        if (!this.chunks.has(chunkPosition.toString())) return null;

        const voxelChunkComponent = this.chunks.get(chunkPosition.toString());
        const chunkLocalPosition = Vector3.Subtract(position, Vector3.Multiply(chunkPosition, 16)).Multiply(2).Floor();
        return voxelChunkComponent.GetVoxel(chunkLocalPosition);
    }

    GetVoxelWorldPosition(position) {
        const chunkPosition = Vector3.Divide(position, 16).Floor();
        if (!this.chunks.has(chunkPosition.toString())) return null;

        const voxelChunkComponent = this.chunks.get(chunkPosition.toString());
        const gridPosition = Vector3.Subtract(position, Vector3.Multiply(chunkCoord, 16)).Multiply(2).Floor();
        return voxelChunkComponent.transform.position.Add(gridPosition.Divide(2));
    }

    FixedUpdate() {
        if (!this.position.Equals(this.lastPosition)) {
            this.lastPosition = this.position;
            this.UpdateChunks();
        }
    }

    UpdateChunks() {
        for (let x = -this.radius; x < this.radius; x++) {
            for (let z = -this.radius; z < this.radius; z++) {
                for (let y = 0; y < 2; y++) {
                    const position = new Vector3(x + this.position.x, y, z + this.position.z).Round();

                    if (!this.chunks.has(position.toString())) {
                        console.log(position.toString());
                        let gameObject = new GameObject("Voxel Chunk");
                        gameObject.transform.position = new Vector3(position.x * 16, y * 16, position.z * 16);

                        let meshRenderer = gameObject.AddComponent(MeshRenderer);
                        meshRenderer.material = this.material;

                        let voxelChunkComponent = gameObject.AddComponent(VoxelChunkComponent);
                        this.voxelGPU.AddToQueue(voxelChunkComponent);

                        this.chunks.set(position.toString(), voxelChunkComponent);
                    }
                }
            }
        }
    }

}