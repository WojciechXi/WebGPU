class Terrain extends Behaviour {

    constructor() {
        super();
        this.mesh = null;
        this.material = null;
        this.terrainData = null;
    }

    get isVisible() { return this.materials.length && this.mesh; } get localBounds() {
        if (!this.mesh) return super.bounds;
        return new Bounds(this.mesh.bounds.center.Clone(), this.mesh.bounds.size);
    }
    get bounds() {
        if (!this.mesh) return super.bounds;

        const worldPoints = this.transform.TransformPoints([
            new Vector3(this.mesh.bounds.center.x + this.mesh.bounds.extents.x, this.mesh.bounds.center.y + this.mesh.bounds.extents.y, this.mesh.bounds.center.z + this.mesh.bounds.extents.z),
            new Vector3(this.mesh.bounds.center.x + this.mesh.bounds.extents.x, this.mesh.bounds.center.y + this.mesh.bounds.extents.y, this.mesh.bounds.center.z - this.mesh.bounds.extents.z),
            new Vector3(this.mesh.bounds.center.x + this.mesh.bounds.extents.x, this.mesh.bounds.center.y - this.mesh.bounds.extents.y, this.mesh.bounds.center.z + this.mesh.bounds.extents.z),
            new Vector3(this.mesh.bounds.center.x + this.mesh.bounds.extents.x, this.mesh.bounds.center.y - this.mesh.bounds.extents.y, this.mesh.bounds.center.z - this.mesh.bounds.extents.z),
            new Vector3(this.mesh.bounds.center.x - this.mesh.bounds.extents.x, this.mesh.bounds.center.y + this.mesh.bounds.extents.y, this.mesh.bounds.center.z + this.mesh.bounds.extents.z),
            new Vector3(this.mesh.bounds.center.x - this.mesh.bounds.extents.x, this.mesh.bounds.center.y + this.mesh.bounds.extents.y, this.mesh.bounds.center.z - this.mesh.bounds.extents.z),
            new Vector3(this.mesh.bounds.center.x - this.mesh.bounds.extents.x, this.mesh.bounds.center.y - this.mesh.bounds.extents.y, this.mesh.bounds.center.z + this.mesh.bounds.extents.z),
            new Vector3(this.mesh.bounds.center.x - this.mesh.bounds.extents.x, this.mesh.bounds.center.y - this.mesh.bounds.extents.y, this.mesh.bounds.center.z - this.mesh.bounds.extents.z),
        ]);

        const min = Vector3.positiveInfinity;
        const max = Vector3.negativeInfinity;

        for (const v of worldPoints) {
            if (v.x < min.x) min.x = v.x;
            if (v.y < min.y) min.y = v.y;
            if (v.z < min.z) min.z = v.z;

            if (v.x > max.x) max.x = v.x;
            if (v.y > max.y) max.y = v.y;
            if (v.z > max.z) max.z = v.z;
        }

        return Bounds.FromMinMax(min, max);
    }

}