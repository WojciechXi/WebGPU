class CapsuleCollider extends Collider {

    Init() {
        super.Init();
        this.radius = 0.5;
        this.height = 2.0; // odległość między końcami kapsuły
    }

    get bottom() { return Vector3.Sub(this.center, new Vector3(0, this.height / 2 - this.radius, 0)); }
    get top() { return Vector3.Add(this.center, new Vector3(0, this.height / 2 - this.radius, 0)); }

    get localBounds() { return new Bounds(this.center, new Vector3(this.radius * 2, this.height, this.radius * 2)); }
    get bounds() {
        const hx = this.radius;
        const hy = this.height / 2;
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

    // Punkty końcowe kapsuły w world space
    GetWorldTop() {
        return Vector3.Add(this.worldCenter, new Vector3(0, this.height / 2, 0));
    }

    GetWorldBottom() {
        return Vector3.Sub(this.worldCenter, new Vector3(0, this.height / 2, 0));
    }

    Intersects(otherCollider) {
        if (otherCollider instanceof SphereCollider) {
            // Najbliższy punkt segmentu kapsuły do sfery
            const position = otherCollider.transform.position;
            const top = this.GetWorldTop();
            const bottom = this.GetWorldBottom();
            const closest = CapsuleCollider.ClosestPointOnSegment(bottom, top, position);
            const delta = Vector3.Subtract(position, closest);

            return delta.SqrMagnitude() <= otherCollider.radius * otherCollider.radius;
        } else if (otherCollider instanceof CapsuleCollider) {
            // Prosta kolizja capsule-capsule: dystans między segmentami < sum radius
            const aTop = this.GetWorldTop();
            const aBottom = this.GetWorldBottom();
            const bTop = otherCollider.GetWorldTop();
            const bBottom = otherCollider.GetWorldBottom();

            const closestA = CapsuleCollider.ClosestPointOnSegment(aBottom, aTop, bBottom);
            const closestB = CapsuleCollider.ClosestPointOnSegment(bBottom, bTop, closestA);

            const delta = Vector3.Subtract(closestA, closestB);
            return delta.SqrMagnitude() <= (this.radius + otherCollider.radius) ** 2;
        } else if (otherCollider instanceof BoxCollider) {

        }
        return false;
    }

    ComputePenetration(otherCollider) {
        if (otherCollider instanceof CapsuleCollider && this.axis === 'Y' && otherCollider.axis === 'Y') {
            const position = this.transform.position;
            const otherColliderPosition = otherCollider.transform.position;

            // najbliższe punkty między odcinkami
            const closestA = Vector3.ClosestPointOnSegment(this.top, this.bottom, otherColliderPosition);
            const closestB = Vector3.ClosestPointOnSegment(otherCollider.top, otherCollider.bottom, position);

            const delta = Vector3.Subtract(closestA, closestB);
            const dist = delta.Magnitude();
            const minDist = this.radius + otherCollider.radius;

            if (dist < minDist) {
                const normal = dist > 0 ? delta.Normalize() : new Vector3(1, 0, 0);
                const depth = minDist - dist;
                return Vector3.Multiply(normal, depth);
            }
        }
        return null;
    }

    Raycast(ray, maxDistance) {
        return super.Raycast(ray, maxDistance);

        const position = this.transform.position;

        const p1a = Vector3.Add(position, new Vector3(0, this.height / 2 - this.radius, 0));
        const p2a = Vector3.Subtract(position, new Vector3(0, this.height / 2 - this.radius, 0));

        const pa = Vector3.ClosestPointOnSegment(ray.origin, p1a, p2a);
        const oc = sub(ray.origin, pa);

        const a = dot(ray.direction, ray.direction);
        const b = 2 * dot(ray.direction, oc);
        const c = dot(oc, oc) - this.radius * this.radius;
        const discriminant = b * b - 4 * a * c;

        return discriminant >= 0;
    }

    ClosestPointOnSegment(position) { return CapsuleCollider.ClosestPointOnSegment(this.top, this.bottom, position); }
    static ClosestPointOnSegment(top, bottom, position) {
        const ab = Vector3.Subtract(bottom, top);
        const t = (Vector3.Subtract(position, top)).Dot(ab) / ab.Dot(ab);
        const clampedT = Mathf.Max(0, Mathf.Min(1, t));
        return Vector3.Add(top, Vector3.Multiply(ab, clampedT));
    }

    OnDrawGizmos(renderPass, camera) {
        const cube = Resources.Get('/Resources/Primitives/Cube.gltf');

        let localBounds = this.localBounds;
        let matrix = Matrix4x4.TRS(Vector3.Add(this.transform.position, localBounds.center), this.transform.rotation, localBounds.size);
        renderPass.DrawMesh(cube.meshes[0], 0, matrix);

        let bounds = this.bounds;
        matrix = Matrix4x4.TRS(bounds.center, Quaternion.identity, bounds.size);
        renderPass.DrawMesh(cube.meshes[0], 0, matrix);
    }

}