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
        const otherBounds = otherCollider.bounds;

        if (bounds.Contains(otherBounds.center)) {
            const terrainWorldHeight = this.terrain.SampleHeight(otherCollider.worldCenter);

            console.log(terrainWorldHeight);

            if (otherBounds.max.y < terrainWorldHeight) return false;
            if (otherBounds.min.y > terrainWorldHeight) return false;

            return true;
        }

        return false;
    }

    ComputePenetration(otherCollider) {
        const terrainWorldHeight = this.terrain.SampleHeight(otherCollider.worldCenter);

        const dist = this.worldCenter.y - terrainWorldHeight;
        const minDist = this.radius;

        if (dist < minDist) {
            const normal = new Vector3(0, dist, 0);
            const depth = minDist - dist;
            return Vector3.Multiply(normal, depth);
        }

        return new Vector3(0, 0.01, 0);
    }

}