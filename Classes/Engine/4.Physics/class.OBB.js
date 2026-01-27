class OBB {

    constructor(center, extents, axes) {
        this.center = center;
        this.extents = extents;
        this.axes = axes;
    }

    Check(obb) {
        const T = Vector3.Sub(obb.center, this.center);
        for (let i = 0; i < 3; i++) {
            if (OBB.IsSeparated(this.axes[i], T, this, obb)) return false;
            if (OBB.IsSeparated(obb.axes[i], T, this, obb)) return false;
        }

        for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 3; j++) {
                const axisToCheck = this.axes[i].Cross(obb.axes[j]);
                if (axisToCheck.sqrMagnitude < 0.001) continue;
                if (OBB.IsSeparated(axisToCheck, T, this, obb)) return false;
            }
        }

        return true;
    }

    CheckSphere(sphere) {
        const d = Vector3.Sub(sphere.center, this.center);
        let closestPoint = this.center.Clone();

        for (let i = 0; i < 3; i++) {
            const axis = this.axes[i];
            const extent = this.extents[i];
            let distance = d.Dot(axis);

            if (distance > extent) distance = extent;
            if (distance < -extent) distance = -extent;

            closestPoint = closestPoint.Add(Vector3.Multiply(axis, distance));
        }

        const collisionVector = Vector3.Sub(sphere.center, closestPoint);
        return collisionVector.sqrMagnitude < (sphere.radius * sphere.radius);
    }

    GetSupportPoint(direction) {
        let result = this.center.Clone();

        for (let i = 0; i < 3; i++) {
            const dot = this.axes[i].Dot(direction);
            const sign = dot >= 0 ? 1 : -1;
            result = result.Add(Vector3.Multiply(this.axes[i], this.extents[i] * sign));
        }

        return result;
    }

    ComputePenetration(obb) {
        const T = Vector3.Sub(obb.center, this.center);

        let minOverlap = Infinity;
        let collisionAxis = null;

        const axesToTest = [
            this.axes[0], this.axes[1], this.axes[2],
            obb.axes[0], obb.axes[1], obb.axes[2]
        ];

        for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 3; j++) {
                const axis = this.axes[i].Cross(obb.axes[j]);
                if (axis.sqrMagnitude >= 0.001) axesToTest.push(axis.normalized);
            }
        }

        for (let axis of axesToTest) {
            const overlap = OBB.GetOverlap(axis, T, this, obb);
            if (overlap <= 0) return null;
            if (overlap < minOverlap) {
                minOverlap = overlap;
                collisionAxis = axis;
            }
        }

        if (collisionAxis.Dot(T) >= 0) collisionAxis = collisionAxis.Negate();
        return collisionAxis.Multiply(minOverlap);
    }

    ComputePenetrationSphere(sphere) {
        const d = Vector3.Sub(sphere.center, this.center);
        let closestPoint = this.center.Clone();

        for (let i = 0; i < 3; i++) {
            const axis = this.axes[i];
            const extent = this.extents[i];
            let distance = d.Dot(axis);

            if (distance > extent) distance = extent;
            if (distance < -extent) distance = -extent;

            closestPoint = closestPoint.Add(Vector3.Multiply(axis, distance));
        }

        const collisionVector = Vector3.Sub(sphere.center, closestPoint);
        const dist = collisionVector.magnitude; // Tutaj już potrzebujemy dokładnej odległości

        // Jeśli środek kuli jest idealnie w tym samym miejscu co closestPoint,
        // wypychamy w stronę pierwszej osi pudełka
        const normal = dist > 0.0001 ? Vector3.Divide(collisionVector, dist) : this.axes[0];
        const overlap = sphere.radius - dist;

        return {
            normal: normal.Normalize(),
            overlap: overlap,
            point: closestPoint
        };
    }

    static IsSeparated(L, T, boxA, boxB) {
        const distProjection = Mathf.Abs(T.Dot(L));

        const radiusA = boxA.extents.x * Mathf.Abs(boxA.axes[0].Dot(L)) + boxA.extents.y * Mathf.Abs(boxA.axes[1].Dot(L)) + boxA.extents.z * Mathf.Abs(boxA.axes[2].Dot(L));
        const radiusB = boxB.extents.x * Mathf.Abs(boxB.axes[0].Dot(L)) + boxB.extents.y * Mathf.Abs(boxB.axes[1].Dot(L)) + boxB.extents.z * Mathf.Abs(boxB.axes[2].Dot(L));

        return distProjection > (radiusA + radiusB);
    }

    static GetOverlap(L, T, boxA, boxB) {
        const distProjection = Mathf.Abs(T.Dot(L));

        const radiusA = boxA.extents.x * Mathf.Abs(boxA.axes[0].Dot(L)) + boxA.extents.y * Mathf.Abs(boxA.axes[1].Dot(L)) + boxA.extents.z * Mathf.Abs(boxA.axes[2].Dot(L));
        const radiusB = boxB.extents.x * Mathf.Abs(boxB.axes[0].Dot(L)) + boxB.extents.y * Mathf.Abs(boxB.axes[1].Dot(L)) + boxB.extents.z * Mathf.Abs(boxB.axes[2].Dot(L));

        return (radiusA + radiusB) - distProjection;
    }

    static GetContactPoint(a, b, normal, mtv) {
        const supportB = b.GetSupportPoint(normal);
        return supportB.Add(Vector3.Multiply(normal, mtv.magnitude * 0.5));
    }

}