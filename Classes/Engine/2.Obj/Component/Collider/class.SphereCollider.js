class SphereCollider extends Collider {

    Init() {
        super.Init();
        this.center = Vector3.zero;
        this.radius = 0.5;
    }

    get worldCenter() { return this.transform.TransformPoint(this.center); }
    get worldRadius() {
        const s = this.transform.scale;
        return this.radius * Mathf.Max(Mathf.Abs(s.x), Mathf.Abs(s.y), Mathf.Abs(s.z));
    }
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
    get sphere() { return new Sphere(this.worldCenter, this.worldRadius); }

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

        // Równanie kwadratowe: at² + bt + c = 0
        const a = localRay.direction.sqrMagnitude; // Zwykle 1, jeśli kierunek jest znormalizowany
        const b = 2 * localRay.origin.Dot(localRay.direction);
        const c = localRay.origin.sqrMagnitude - this.radius * this.radius;

        const discriminant = b * b - 4 * a * c;

        if (discriminant < 0) return null;

        const sqrtDistance = Mathf.Sqrt(discriminant);
        let distance = (-b - sqrtDistance) / (2 * a);

        if (distance < 0) distance = (-b + sqrtDistance) / (2 * a);

        if (distance < 0 || distance > maxDistance) return null;

        const localPoint = localRay.GetPoint(distance);
        const localNormal = Vector3.Subtract(localPoint, this.center).normalized;

        const worldPoint = this.transform.TransformPoint(localPoint);
        const worldNormal = this.transform.TransformDirection(localNormal);

        return new RaycastHit(this, worldPoint, worldNormal, distance);
    }

    OnDrawGizmos(renderPass, camera) {
        renderPass.DrawSphere(this.worldCenter, this.radius, this.transform.rotation);
        renderPass.DrawRay(new Ray(this.transform.position, this.transform.forward));
    }


}