class TerrainCollider extends Collider {

    Init() {
        super.Init();
        this.terrain = this.GetComponent(Terrain);
    }

    get bounds() {
        return this.terrain.bounds;
    }

    Intersects(otherCollider) {
        const bounds = this.bounds;
        const otherWorldCenter = otherCollider.worldCenter;

        if (bounds.Contains(otherWorldCenter)) {
            const boundsMin = bounds.min;
            const boundsMax = bounds.max;

            const boundsDiff = Vector3.Subtract(boundsMax, boundsMin);
            const terrainSpacePosition = Vector3.Subtract(otherWorldCenter, boundsMin);

            const xLinear = terrainSpacePosition.x / boundsDiff.x;
            const zLinear = terrainSpacePosition.z / boundsDiff.z;

            const terrainWorldHeight = this.terrain.GetWorldHeight(xLinear, zLinear);
            if (otherWorldCenter.y + 0.5 < terrainWorldHeight) return false;
            if (otherWorldCenter.y - 0.5 > terrainWorldHeight) return false;

            return true;
        }

        return false;
    }

    ComputePenetration(otherCollider) {
        const bounds = this.bounds;
        const otherWorldCenter = otherCollider.worldCenter;

        const boundsMin = bounds.min;
        const boundsMax = bounds.max;

        const boundsDiff = Vector3.Subtract(boundsMax, boundsMin);
        const terrainSpacePosition = Vector3.Subtract(otherWorldCenter, boundsMin);

        const xLinear = terrainSpacePosition.x / boundsDiff.x;
        const zLinear = terrainSpacePosition.z / boundsDiff.z;

        const terrainWorldHeight = this.terrain.GetWorldHeight(xLinear, zLinear);

        const worldCenter = this.worldCenter;
        const dist = worldCenter.y - terrainWorldHeight;
        const minDist = this.radius;

        if (dist < minDist) {
            const normal = new Vector3(0, dist, 0);
            const depth = minDist - dist;
            return Vector3.Multiply(normal, depth);
        }

        return new Vector3(0, 0.01, 0);
    }

}