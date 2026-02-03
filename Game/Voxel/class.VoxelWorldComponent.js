class VoxelWorldComponent extends MonoBehaviour {

    OnEnable() {
        VoxelWorldComponent.Instance = this;

        this.voxelGPU = this.GetComponent(VoxelGPU);
        this.camera = Camera.main;
        this.material = null;

        this.position = Vector3.zero;
        this.lastPosition = null;
        this.radius = 1;

        this.chunks = new Map();
    }

    IsSolid(position) {
        let voxel = this.GetVoxel(position);
        return voxel ? voxel.isSolid : false;
    }

    GetVoxel(position) {
        const chunkPosition = Vector3.Divide(position, VoxelChunkSize).Floor();
        if (!this.chunks.has(chunkPosition.toString())) return null;

        const voxelChunkComponent = this.chunks.get(chunkPosition.toString());
        const chunkLocalPosition = Vector3.Subtract(position, Vector3.Multiply(chunkPosition, VoxelChunkSize)).Multiply(VoxelDensity).Floor();
        return voxelChunkComponent.GetVoxel(chunkLocalPosition);
    }

    GetVoxelWorldPosition(position) {
        const chunkPosition = Vector3.Divide(position, VoxelChunkSize).Floor();
        if (!this.chunks.has(chunkPosition.toString())) return null;

        const voxelChunkComponent = this.chunks.get(chunkPosition.toString());
        const chunkLocalPosition = Vector3.Subtract(position, Vector3.Multiply(chunkPosition, VoxelChunkSize)).Multiply(VoxelDensity).Floor();
        return voxelChunkComponent.transform.position.Add(chunkLocalPosition.Divide(VoxelDensity));
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
                for (let y = 0; y < VoxelChunksPerColumn; y++) {
                    const position = new Vector3(x + this.position.x, y, z + this.position.z).Round();

                    if (!this.chunks.has(position.toString())) {
                        console.log(position.toString());
                        let gameObject = new GameObject("Voxel Chunk");
                        gameObject.transform.position = new Vector3(position.x * VoxelChunkSize, y * VoxelChunkSize, position.z * VoxelChunkSize);

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

    Remove(worldPosition, worldRadius = 1, isoStrength = 0.5) {
        this.EditWorld(worldPosition, worldRadius, isoStrength, "remove", null);
    }

    Add(worldPosition, blockId, worldRadius = 1, isoStrength = 0.5) {
        this.EditWorld(worldPosition, worldRadius, isoStrength, "add", blockId);
    }

    // Wspólna metoda dla Add i Remove, aby nie powtarzać logiki szukania chunków
    EditWorld(worldPosition, worldRadius, isoStrength, mode, blockId) {
        let extents = new Vector3(worldRadius, worldRadius, worldRadius);
        let min = Vector3.Subtract(worldPosition, extents);
        let max = Vector3.Add(worldPosition, extents);

        // 1. Znajdź zakres chunków do sprawdzenia
        let minChunk = Vector3.Divide(min, VoxelChunkSize).Floor();
        let maxChunk = Vector3.Divide(max, VoxelChunkSize).Floor();

        for (let x = minChunk.x; x <= maxChunk.x; x++) {
            for (let y = minChunk.y; y <= maxChunk.y; y++) {
                for (let z = minChunk.z; z <= maxChunk.z; z++) {
                    const chunkPos = new Vector3(x, y, z);
                    const voxelChunkComponent = this.chunks.get(chunkPos.toString());

                    if (voxelChunkComponent) {
                        // 2. Przeliczamy worldPosition na lokalną pozycję chunka (w jednostkach świata)
                        const localOrigin = Vector3.Subtract(worldPosition, voxelChunkComponent.transform.position);

                        // 3. Wywołujemy edycję bezpośrednio na chunku
                        // Przekazujemy promień i siłę, aby chunk sam wiedział które voxele zmodyfikować
                        const modified = voxelChunkComponent.voxelChunk.EditVoxels(localOrigin, worldRadius, isoStrength, mode, blockId);

                        // 4. Jeśli chunk został zmieniony, wyślij go do GPU w celu przebudowania mesha
                        if (modified) {
                            this.voxelGPU.AddToQueue(voxelChunkComponent);
                        }
                    }
                }
            }
        }
    }

}