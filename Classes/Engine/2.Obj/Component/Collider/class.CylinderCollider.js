class CylinderCollider extends Collider {

    Init() {
        super.Init();
        this.center = Vector3.zero;
        this.radius = 0.5;
        this.height = 2.0;
    }

    OnEnable() {
        const meshRenderer = this.GetComponent(MeshRenderer);
        if (meshRenderer) {
            const bounds = meshRenderer.mesh.bounds;
            this.center = bounds.center;
            this.radius = Math.max(bounds.size.x, bounds.size.z) / 2;
            this.height = bounds.size.y;
        }
    }

    Raycast(ray, maxDistance) {
        const localRay = this.transform.InverseTransformRay(ray);

        const origin = Vector3.Subtract(localRay.origin, this.center);
        const dir = localRay.direction;

        const halfH = this.height / 2;
        let distance = Infinity;
        let hitNormal = new Vector3(0, 0, 0);

        const capAxes = [halfH, -halfH];
        for (let capY of capAxes) {
            if (Math.abs(dir.y) > 0.000001) {
                const t = (capY - origin.y) / dir.y;
                if (t >= 0 && t < maxDistance && t < distance) {
                    const p = Vector3.Add(origin, Vector3.Scale(dir, t));
                    if (p.x * p.x + p.z * p.z <= this.radius * this.radius) {
                        distance = t;
                        hitNormal.set(0, capY > 0 ? 1 : -1, 0);
                    }
                }
            }
        }

        const a = dir.x * dir.x + dir.z * dir.z;
        const b = 2 * (origin.x * dir.x + origin.z * dir.z);
        const c = origin.x * origin.x + origin.z * origin.z - this.radius * this.radius;

        const discriminant = b * b - 4 * a * c;

        if (discriminant >= 0) {
            const sqrtD = Math.sqrt(discriminant);
            const t0 = (-b - sqrtD) / (2 * a);

            if (t0 >= 0 && t0 < maxDistance && t0 < distance) {
                const yAtT0 = origin.y + t0 * dir.y;
                if (yAtT0 <= halfH && yAtT0 >= -halfH) {
                    distance = t0;
                    const p = Vector3.Add(origin, Vector3.Scale(dir, t0));
                    hitNormal.set(p.x, 0, p.z).normalize();
                }
            }
        }

        if (distance === Infinity) return null;

        const localPoint = localRay.GetPoint(distance);
        const worldPoint = this.transform.TransformPoint(localPoint);
        const worldNormal = this.transform.TransformDirection(hitNormal);

        return new RaycastHit(this, worldPoint, worldNormal, distance);
    }
}