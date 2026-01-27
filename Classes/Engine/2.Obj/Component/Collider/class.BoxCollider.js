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
        if (other instanceof BoxCollider) {
            return this.bounds.Intersects(other.bounds) && OBB.Check(this.obb, other.obb);
        } else if (other instanceof SphereCollider || other instanceof CapsuleCollider) {
            return other.Intersects(this);
        }
        return false;
    }

    ComputePenetration(other) {
        if (!other) return null;

        if (other instanceof BoxCollider) {
            return OBB.ComputePenetration(this.obb, other.obb);
        }

        if (other instanceof SphereCollider) {
            return other.ComputePenetration(this);
        }

        return null;
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