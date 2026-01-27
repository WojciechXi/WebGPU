class OBB {

    constructor(center, extents, axes) {
        this.center = center;
        this.extents = extents;
        this.axes = axes;
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

    static Check(a, b) {
        const T = Vector3.Sub(b.center, a.center);
        for (let i = 0; i < 3; i++) {
            if (OBB.IsSeparated(a.axes[i], T, a, b)) return false;
            if (OBB.IsSeparated(b.axes[i], T, a, b)) return false;
        }

        for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 3; j++) {
                const axisToCheck = a.axes[i].Cross(b.axes[j]);
                if (axisToCheck.sqrMagnitude < 0.001) continue;
                if (OBB.IsSeparated(axisToCheck, T, a, b)) return false;
            }
        }

        return true;
    }

    static ComputePenetration(a, b) {
        const T = Vector3.Sub(b.center, a.center);

        let minOverlap = Infinity;
        let collisionAxis = null;

        const axesToTest = [
            a.axes[0], a.axes[1], a.axes[2],
            b.axes[0], b.axes[1], b.axes[2]
        ];

        for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 3; j++) {
                const axis = a.axes[i].Cross(b.axes[j]);
                if (axis.sqrMagnitude >= 0.001) axesToTest.push(axis.normalized);
            }
        }

        for (let axis of axesToTest) {
            const overlap = OBB.GetOverlap(axis, T, a, b);
            if (overlap <= 0) return null;
            if (overlap < minOverlap) {
                minOverlap = overlap;
                collisionAxis = axis;
            }
        }

        if (collisionAxis.Dot(T) >= 0) collisionAxis = collisionAxis.Negate();
        // if (collisionAxis.Dot(T) < 0) collisionAxis = collisionAxis.Negate();
        return collisionAxis.Multiply(minOverlap);
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