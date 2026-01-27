class BoxCollider extends Collider {

    Init() {
        super.Init();
        this.center = Vector3.zero;
        this.size = Vector3.one; // rozmiar boxa w lokalnej skali
    }

    OnEnable() {
        const meshRenderer = this.GetComponent(MeshRenderer);
        if (meshRenderer) {
            const bounds = meshRenderer.mesh.bounds;
            this.center = bounds.center;
            this.size = bounds.size;
        }
    }

    get worldCenter() { return this.transform.TransformPoint(this.center); }
    get localBounds() { return new Bounds(this.center.Clone(), this.size.Clone()); }
    get bounds() {
        const hx = this.size.x / 2;
        const hy = this.size.y / 2;
        const hz = this.size.z / 2;

        return GeometryUtility.CalculateBounds([
            new Vector3(this.center.x + hx, this.center.y + hy, this.center.z + hz),
            new Vector3(this.center.x + hx, this.center.y + hy, this.center.z - hz),
            new Vector3(this.center.x + hx, this.center.y - hy, this.center.z + hz),
            new Vector3(this.center.x + hx, this.center.y - hy, this.center.z - hz),
            new Vector3(this.center.x - hx, this.center.y + hy, this.center.z + hz),
            new Vector3(this.center.x - hx, this.center.y + hy, this.center.z - hz),
            new Vector3(this.center.x - hx, this.center.y - hy, this.center.z + hz),
            new Vector3(this.center.x - hx, this.center.y - hy, this.center.z - hz),
        ], this.transform.matrix4x4);
    }
    get obb() {
        return new OBB(this.transform.TransformPoint(this.center), Vector3.Divide(this.size, 2).Scale(this.transform.scale.Abs()), [this.transform.right, this.transform.up, this.transform.forward]);
    }

    Intersects(other) {
        if (!other) return false;

        if (other instanceof BoxCollider) return this.bounds.Intersects(other.bounds) && this.obb.Check(other.obb);
        if (other instanceof SphereCollider) return this.bounds.Intersects(other.bounds) && this.obb.CheckSphere(other.sphere);

        return false;
    }

    ComputePenetration(other) {
        if (!other) return null;

        if (other instanceof BoxCollider) return this.obb.ComputePenetration(other.obb);
        if (other instanceof SphereCollider) return this.obb.ComputePenetrationSphere(other.sphere);

        return null;
    }

    OnDrawGizmos(renderPass, camera) {
        const cube = Resources.Get('/Resources/Primitives/Cube.gltf');

        let bounds = this.bounds;
        let matrix = Matrix4x4.TRS(bounds.center, Quaternion.identity, bounds.size);
        renderPass.DrawMesh(cube.meshes[0], 0, matrix);
    }

}