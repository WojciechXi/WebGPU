class VoxelChunk {

    constructor() {
        this.generated = false;
        this.voxels = new Array(VoxelChunkVolume);
    }

    GetIndex(localPosition) {
        const size = VoxelResolutionOne;

        const x = Mathf.FloorToInt(localPosition.x);
        const y = Mathf.FloorToInt(localPosition.y);
        const z = Mathf.FloorToInt(localPosition.z);

        return parseInt(x + y * size + z * size * size);
    }

    GetVoxel(localPosition) {
        let index = this.GetIndex(localPosition);
        return this.voxels[index];
    }

    ModifyVoxel(localPosition, influence, mode, blockId) {
        const index = this.GetIndex(localPosition);
        if (index === -1) return false;

        let v = this.voxels[index];
        if (mode === "add") {
            v.iso += influence;
            // Nadajemy ID bloku tylko jeśli faktycznie "tworzymy" teren
            if (v.iso > 0.1) v.blockId = blockId;
        } else {
            v.iso -= influence;
            if (v.iso < 0.01) v.blockId = 0;
        }

        v.iso = Mathf.Max(0, Mathf.Min(1, v.iso));
        return true;
    }

    EditVoxels(localOrigin, radius, strength, mode, blockId) {
        let changed = false;

        // 1. Zamieniamy lokalną pozycję świata i promień na jednostki siatki (0-32)
        const gridPos = Vector3.Multiply(localOrigin, VoxelDensity);
        const gridRadius = Mathf.CeilToInt(radius * VoxelDensity);

        // 2. Obliczamy zakres pętli tylko dla obszaru dotkniętego zmianą
        const minX = Mathf.Max(0, Math.floor(gridPos.x - gridRadius));
        const maxX = Mathf.Min(VoxelResolution, Mathf.CeilToInt(gridPos.x + gridRadius));
        const minY = Mathf.Max(0, Math.floor(gridPos.y - gridRadius));
        const maxY = Mathf.Min(VoxelResolution, Mathf.CeilToInt(gridPos.y + gridRadius));
        const minZ = Mathf.Max(0, Math.floor(gridPos.z - gridRadius));
        const maxZ = Mathf.Min(VoxelResolution, Mathf.CeilToInt(gridPos.z + gridRadius));

        // 3. Iterujemy tylko wewnątrz "kostki" obejmującej sferę
        for (let x = minX; x <= maxX; x++) {
            for (let y = minY; y <= maxY; y++) {
                for (let z = minZ; z <= maxZ; z++) {
                    let localPosition = new Vector3(x, y, z);

                    // voxelPos w jednostkach świata (x/2, y/2, z/2)
                    let dx = x / VoxelDensity - localOrigin.x;
                    let dy = y / VoxelDensity - localOrigin.y;
                    let dz = z / VoxelDensity - localOrigin.z;
                    let dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

                    if (dist < radius) {
                        let influence = (1.0 - dist / radius) * strength;
                        if (this.ModifyVoxel(localPosition, influence, mode, blockId)) {
                            changed = true;
                        }
                    }
                }
            }
        }
        return changed;
    }

}