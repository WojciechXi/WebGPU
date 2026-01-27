class MeshCollider extends Collider {

    Init() {
        super.Init();
        this.mesh = null;
    }

    OnEnable() {
        const meshRenderer = this.GetComponent(MeshRenderer);
        if (meshRenderer) {
            this.mesh = meshRenderer.mesh;
        }
    }

    get worldCenter() { return this.mesh ? this.transform.TransformPoint(this.mesh.bounds.center) : super.worldCenter; }
    get localBounds() { return this.mesh ? new Bounds(this.mesh.bounds.center.Clone(), this.mesh.bounds.size.Clone()) : super.localBounds; }
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

    Intersects(other) {
        return false;
    }

    Raycast(ray, maxDistance) {
        if (!this.mesh) return null;
        if (!this.mesh.subMeshes.length) return null;

        const localRay = this.transform.InverseTransformRay(ray);

        let distance = Infinity;
        let nearestNormal = null;

        const vertices = this.mesh.vertices;
        const triangles = this.mesh.subMeshes[0].triangles;

        // Iteracja przez trójkąty (co 3 indeksy)
        for (let i = 0; i < triangles.length; i += 3) {
            const v0 = vertices[triangles[i]];
            const v1 = vertices[triangles[i + 1]];
            const v2 = vertices[triangles[i + 2]];

            const t = this.IntersectTriangle(localRay, v0, v1, v2);

            if (t !== null && t < distance && t <= maxDistance) {
                distance = t;

                const edge1 = Vector3.Subtract(v1, v0);
                const edge2 = Vector3.Subtract(v2, v0);
                nearestNormal = edge1.Cross(edge2).Normalize();
            }
        }

        if (distance === Infinity) return null;

        const localPoint = localRay.GetPoint(distance);

        return new RaycastHit(
            this,
            this.transform.TransformPoint(localPoint),
            this.transform.TransformDirection(nearestNormal),
            distance
        );
    }

    IntersectTriangle(ray, v0, v1, v2) {
        const edge1 = Vector3.Subtract(v1, v0);
        const edge2 = Vector3.Subtract(v2, v0);
        const h = ray.direction.Cross(edge2);
        const a = edge1.Dot(h);

        if (a > -0.00001 && a < 0.00001) return null; // Promień równoległy

        const f = 1.0 / a;
        const s = Vector3.Subtract(ray.origin, v0);
        const u = f * s.Dot(h);

        if (u < 0.0 || u > 1.0) return null;

        const q = s.Cross(edge1);
        const v = f * ray.direction.Dot(q);

        if (v < 0.0 || u + v > 1.0) return null;

        const t = f * edge2.Dot(q);
        return t > 0.00001 ? t : null;
    }

}