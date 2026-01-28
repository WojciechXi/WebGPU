class BoxCollider extends Collider {

    Init() {
        super.Init();
        this.center = Vector3.zero;
        this.size = Vector3.one; // rozmiar boxa w lokalnej skali
    }

    OnEnable() {
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

    Raycast(ray, maxDistance) {
        const localRay = this.transform.InverseTransformRay(ray);

        const halfSize = Vector3.Divide(this.size, 2);
        const min = new Vector3(-halfSize.x, -halfSize.y, -halfSize.z);
        const max = new Vector3(halfSize.x, halfSize.y, halfSize.z);

        let tMin = 0;
        let tMax = maxDistance;

        let hitNormal = new Vector3(0, 0, 0);

        for (let axis = 0; axis < localRay.direction.length; axis++) {
            const invDirection = 1.0 / localRay.direction[axis];

            let t0 = (min[axis] - localRay.origin[axis]) * invDirection;
            let t1 = (max[axis] - localRay.origin[axis]) * invDirection;

            if (invDirection < 0) [t0, t1] = [t1, t0];

            if (t0 > tMin) {
                tMin = t0;
                hitNormal.set(0, 0, 0);
                hitNormal[axis] = invDirection < 0 ? 1 : -1;
            }

            tMax = Mathf.Min(tMax, t1);

            if (tMax < tMin) return null;
        }

        const distance = tMin;

        const localPoint = localRay.GetPoint(distance);
        const worldPoint = this.transform.TransformPoint(localPoint);
        const worldNormal = this.transform.TransformDirection(hitNormal);

        return new RaycastHit(this, worldPoint, worldNormal, distance);
    }

    OnDrawGizmos(renderPass, camera) {
        let bounds = this.bounds;
        renderPass.DrawCube(bounds.center, bounds.size);
        renderPass.DrawRay(new Ray(this.transform.position, this.transform.forward));
    }

    GetGeometry() { return new BoxGeometry(this.worldCenter, Vector3.Divide(this.size, 2).Scale(this.transform.scale.Abs()), [this.transform.right, this.transform.up, this.transform.forward]); }

}