class SphereCollider extends Collider {

    Init() {
        super.Init();
        this.center = Vector3.zero;
        this.radius = 0.5;
    }

    get worldCenter() { return this.transform.TransformPoint(this.center); }
    get localBounds() { return new Bounds(this.center.Clone(), new Vector3(this.radius * 2, this.radius * 2, this.radius * 2)); }
    get bounds() {
        const hx = this.radius;
        const hy = this.radius;
        const hz = this.radius;

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
    get sphere() {
        return new Sphere(this.transform.TransformPoint(this.center), this.radius);
    }

    Intersects(other) {
        if (!other) return false;

        if (other instanceof BoxCollider) return this.bounds.Intersects(other.bounds) && other.obb.CheckSphere(this.sphere);
        if (other instanceof SphereCollider) return this.bounds.Intersects(other.bounds) && other.sphere.Check(this.sphere);

        return null;
    }

    ComputePenetration(other) {
        if (!other) return null;

        if (other instanceof BoxCollider) return other.obb.ComputePenetrationSphere(this.sphere);
        if (other instanceof SphereCollider) return other.sphere.ComputePenetration(this.sphere);

        return null;
    }

    Raycast(ray, maxDistance) {
        const localRay = this.transform.InverseTransformRay(ray);
        // return this.localBounds.IntersectRay(localRay);

        const a = Vector3.Dot(localRay.direction, localRay.direction);
        const b = 2 * Vector3.Dot(localRay.origin, localRay.direction);
        const c = Vector3.Dot(localRay.origin, localRay.origin) - this.radius * this.radius;

        const discriminant = b * b - 4 * a * c;
        if (discriminant < 0)
            return false;

        const sqrtD = Math.sqrt(discriminant);
        const t0 = (-b - sqrtD) / (2 * a);
        const t1 = (-b + sqrtD) / (2 * a);

        // maxDistance w world space → lokalny?
        // jeśli skala ≠ 1, musisz to przeliczyć
        return t0 <= maxDistance && t1 >= 0;
    }

    OnDrawGizmos(renderPass, camera) {
        const cube = Resources.Get('/Resources/Primitives/Cube.gltf');

        let bounds = this.bounds;
        let matrix = Matrix4x4.TRS(bounds.center, Quaternion.identity, bounds.size);
        renderPass.DrawMesh(cube.meshes[0], 0, matrix);
    }


}