class VoxelWorldComponent extends MonoBehaviour {

    OnEnable() {
        this.voxelGPU = this.GetComponent(VoxelGPU);
        this.camera = Camera.main;
        this.material = null;

        this.cameraPosition = null;
        this.lastCameraPosition = null;
        this.radius = 1;

        this.chunks = new Map();
    }

    FixedUpdate() {
        this.cameraPosition = this.camera.transform.position.Divide(16).Round();
        if (!this.cameraPosition.Equals(this.lastCameraPosition)) {
            this.lastCameraPosition = this.cameraPosition;
            this.UpdateChunks();
        }
    }

    UpdateChunks() {
        for (let x = -this.radius; x < this.radius; x++) {
            for (let z = -this.radius; z < this.radius; z++) {
                for (let y = 0; y < 2; y++) {
                    const position = new Vector3(x + this.cameraPosition.x, y, z + this.cameraPosition.z).Round();

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