class SphereCollider extends Collider {

    Init() {
        super.Init();
        this.radius = 0.5;
    }

    get localBounds() {
        return new Bounds(this.center.Clone(), new Vector3(this.radius, this.radius, this.radius));
    }
    get bounds() {
        const worldPoints = this.transform.TransformPoints([
            new Vector3(this.center.x + this.radius, this.center.y + this.radius, this.center.z + this.radius),
            new Vector3(this.center.x + this.radius, this.center.y + this.radius, this.center.z - this.radius),
            new Vector3(this.center.x + this.radius, this.center.y - this.radius, this.center.z + this.radius),
            new Vector3(this.center.x + this.radius, this.center.y - this.radius, this.center.z - this.radius),
            new Vector3(this.center.x - this.radius, this.center.y + this.radius, this.center.z + this.radius),
            new Vector3(this.center.x - this.radius, this.center.y + this.radius, this.center.z - this.radius),
            new Vector3(this.center.x - this.radius, this.center.y - this.radius, this.center.z + this.radius),
            new Vector3(this.center.x - this.radius, this.center.y - this.radius, this.center.z - this.radius),
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
        if (otherCollider instanceof TerrainCollider) {
            return otherCollider.Intersects(this);
        } else if (otherCollider instanceof SphereCollider) {
            const worldCenter = this.worldCenter;
            const otherColliderWorldCenter = otherCollider.worldCenter;

            const distSqr = Vector3.Subtract(worldCenter, otherColliderWorldCenter).sqrMagnitude;
            const rSum = this.radius + otherCollider.radius;

            return distSqr <= rSum * rSum;
        } else if (otherCollider instanceof BoxCollider) {
            const worldCenter = this.worldCenter;

            const otherColliderBounds = otherCollider.bounds;
            const boxMin = otherColliderBounds.min;
            const boxMax = otherColliderBounds.max;

            const x = Mathf.Max(boxMin.x, Mathf.Min(worldCenter.x, boxMax.x));
            const y = Mathf.Max(boxMin.y, Mathf.Min(worldCenter.y, boxMax.y));
            const z = Mathf.Max(boxMin.z, Mathf.Min(worldCenter.z, boxMax.z));

            const closest = new Vector3(x, y, z);
            const delta = Vector3.Subtract(worldCenter, closest);

            return delta.sqrMagnitude <= this.radius * this.radius;
        } else if (otherCollider instanceof CapsuleCollider) {
            return otherCollider.Intersects(this);
        }
        return false;
    }

    ComputePenetration(otherCollider) {
        if (otherCollider instanceof TerrainCollider) {
            return otherCollider.ComputePenetration(this);
        } else if (otherCollider instanceof SphereCollider) {
            const worldCenter = this.worldCenter;
            const delta = Vector3.Subtract(worldCenter, otherCollider.worldCenter);
            const dist = delta.magnitude;
            const minDist = this.radius + otherCollider.radius;

            if (dist < minDist) {
                const normal = dist > 0 ? delta.Normalize() : new Vector3(1, 0, 0);
                const depth = minDist - dist;
                return Vector3.Multiply(normal, depth);
            }
        } else if (otherCollider instanceof BoxCollider) {
            const worldCenter = this.worldCenter;
            const otherColliderBounds = otherCollider.bounds;

            const boxMin = otherColliderBounds.min;
            const boxMax = otherColliderBounds.max;

            // clamp sphere center to box
            const closest = new Vector3(
                Mathf.Max(boxMin.x, Mathf.Min(worldCenter.x, boxMax.x)),
                Mathf.Max(boxMin.y, Mathf.Min(worldCenter.y, boxMax.y)),
                Mathf.Max(boxMin.z, Mathf.Min(worldCenter.z, boxMax.z))
            );

            const delta = Vector3.Subtract(worldCenter, closest);
            const dist = delta.magnitude;

            if (dist < this.radius) {
                const normal = dist > 0 ? delta.Normalize() : new Vector3(1, 0, 0);
                const depth = this.radius - dist;
                return Vector3.Multiply(normal, depth);
            }
        }

        return null;
    }

    Raycast(ray, maxDistance) {
        const localRay = this.transform.InverseTransformRay(ray);
        return this.localBounds.IntersectRay(localRay);

        const a = Vector3.Dot(localRay.direction, localRay.direction);          // = 1
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
        const sphere = Resources.Get('/Resources/Primitives/Sphere.gltf');
        let localBounds = this.localBounds;
        let matrix = Matrix4x4.TRS(localBounds.center, this.transform.rotation, localBounds.size);
        renderPass.DrawMesh(sphere.meshes[0], 0, matrix);

        const cube = Resources.Get('/Resources/Primitives/Cube.gltf');

        let bounds = this.bounds;
        matrix = Matrix4x4.TRS(bounds.center, Quaternion.identity, bounds.size);
        renderPass.DrawMesh(cube.meshes[0], 0, matrix);
    }


}