class BoxCollider extends Collider {

    Init() {
        super.Init();
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

    get localBounds() {
        return new Bounds(this.center.Clone(), this.size.Clone());
    }
    get bounds() {
        const c = this.center;
        const hx = this.size.x / 2;
        const hy = this.size.y / 2;
        const hz = this.size.z / 2;

        const worldPoints = this.transform.TransformPoints([
            new Vector3(c.x + hx, c.y + hy, c.z + hz),
            new Vector3(c.x + hx, c.y + hy, c.z - hz),
            new Vector3(c.x + hx, c.y - hy, c.z + hz),
            new Vector3(c.x + hx, c.y - hy, c.z - hz),
            new Vector3(c.x - hx, c.y + hy, c.z + hz),
            new Vector3(c.x - hx, c.y + hy, c.z - hz),
            new Vector3(c.x - hx, c.y - hy, c.z + hz),
            new Vector3(c.x - hx, c.y - hy, c.z - hz),
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

    Intersects(otherCollider) {
        if (otherCollider instanceof BoxCollider) {
            return this.bounds.Intersects(otherCollider.bounds);
        } else if (otherCollider instanceof SphereCollider || otherCollider instanceof CapsuleCollider) {
            return otherCollider.Intersects(this);
        }
        return false;
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

    Raycast(ray, maxDistance) {
        return this.bounds.IntersectRay(ray);

        const localRay = new Ray(
            this.transform.InverseTransformPoint(ray.origin),
            this.transform.InverseTransformDirection(ray.direction)
        );

        return this.localBounds.IntersectRay(localRay);
    }

    OnDrawGizmos(renderPass, camera) {
        const cube = Resources.Get('/Resources/Primitives/Cube.gltf');

        let localBounds = this.localBounds;
        let matrix = Matrix4x4.TRS(localBounds.center, this.transform.rotation, localBounds.size);
        renderPass.DrawMesh(cube.meshes[0], 0, matrix);

        let bounds = this.bounds;
        matrix = Matrix4x4.TRS(bounds.center, Quaternion.identity, bounds.size);
        renderPass.DrawMesh(cube.meshes[0], 0, matrix);
    }


}