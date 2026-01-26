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

    get worldCenter() { return Vector3.Add(this.transform.position, this.center); }
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

    ComputePenetration(otherCollider) {
        if (otherCollider instanceof BoxCollider) {
            let bounds = this.bounds;
            let otherColliderBounds = otherCollider.bounds;

            const aMin = bounds.min;
            const aMax = bounds.max;

            const bMin = otherColliderBounds.min;
            const bMax = otherColliderBounds.max;

            // overlap po osiach
            const dx = Mathf.Min(aMax.x, bMax.x) - Mathf.Max(aMin.x, bMin.x);
            const dy = Mathf.Min(aMax.y, bMax.y) - Mathf.Max(aMin.y, bMin.y);
            const dz = Mathf.Min(aMax.z, bMax.z) - Mathf.Max(aMin.z, bMin.z);

            if (dx > 0 && dy > 0 && dz > 0) {
                // najmniejszy overlap → to będzie oś korekcji
                if (dx < dy && dx < dz) {
                    return new Vector3(aMax.x > bMax.x ? dx : -dx, 0, 0);
                } else if (dy < dz) {
                    return new Vector3(0, aMax.y > bMax.y ? dy : -dy, 0);
                } else {
                    return new Vector3(0, 0, aMax.z > bMax.z ? dz : -dz);
                }
            }
        } else if (otherCollider instanceof SphereCollider) {
            return otherCollider.ComputePenetration(this);
        }

        return null;
    }

    Intersects(otherCollider) {
        if (otherCollider instanceof BoxCollider) {
            if (this.bounds.Intersects(otherCollider.bounds)) { //AABB
                return true; //OBB
            }
        } else if (otherCollider instanceof SphereCollider || otherCollider instanceof CapsuleCollider) {
            return otherCollider.Intersects(this);
        }
        return false;
    }

    OnDrawGizmos(renderPass, camera) {
        const cube = Resources.Get('/Resources/Primitives/Cube.gltf');

        let localBounds = this.localBounds;
        let matrix = Matrix4x4.TRS(Vector3.Add(this.transform.position, localBounds.center), this.transform.rotation, localBounds.size);
        renderPass.DrawMesh(cube.meshes[0], 0, matrix);

        let bounds = this.bounds;
        matrix = Matrix4x4.TRS(bounds.center, Quaternion.identity, bounds.size);
        renderPass.DrawMesh(cube.meshes[0], 0, matrix);

        // renderPass.DrawLine(Vector3.left, Vector3.right);
    }


}