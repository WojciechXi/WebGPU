class TerrainCollider extends Collider {

    Init() {
        this.terrain = this.GetComponent(Terrain);
    }

    get bounds() {
        const terrainMeshBounds = this.terrain.mesh.bounds;
        return new Bounds(this.worldCenter + terrainMeshBounds.center, terrainMeshBounds.size);
    }

    Intersects(other) {
        return this.bounds.Contains(other.worldCenter);
    }

    ComputePenetration(other) {
        return Vector3.up;
    }

}