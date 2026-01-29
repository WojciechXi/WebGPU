class Bounds extends Float32Array {

    static FromMinMax(min, max) {
        const center = Vector3.Multiply(Vector3.Add(min, max), 0.5);
        const size = Vector3.Subtract(max, min);
        return new Bounds(center, size);
    }

    /* Unity */

    // Properties
    get center() { return new Vector3(this[0], this[1], this[2]); }
    get extents() { return new Vector3(this[3], this[4], this[5]); }
    get min() { return Vector3.Subtract(this.center, this.extents); }
    get max() { return Vector3.Add(this.center, this.extents); }
    get size() { return new Vector3(this[3] * 2, this[4] * 2, this[5] * 2); }

    // Constructors
    constructor(center, size) {
        super(6);

        this[0] = center.x;
        this[1] = center.y;
        this[2] = center.z;

        this[3] = size.x / 2;
        this[4] = size.y / 2;
        this[5] = size.z / 2;
    }

    // Public Methods
    ClosestPoint(point) {
        const min = this.min;
        const max = this.max;
        return new Vector3(Mathf.Clamp(position.x, min.x, max.x), Mathf.Clamp(position.y, min.y, max.y), Mathf.Clamp(position.z, min.z, max.z));
    }

    Contains(point) {
        const min = this.min;
        const max = this.max;

        return (
            point.x >= min.x &&
            point.y >= min.y &&
            point.z >= min.z &&
            point.x <= max.x &&
            point.y <= max.y &&
            point.z <= max.z
        );
    }

    Encapsulate(point) {
        return null;
    }

    Expand(amount) {
        return null;
    }

    IntersectRay(ray) {
        const min = this.min;
        const max = this.max;

        let tmin = (min.x - ray.origin.x) / ray.direction.x;
        let tmax = (max.x - ray.origin.x) / ray.direction.x;
        if (tmin > tmax) [tmin, tmax] = [tmax, tmin];

        let tymin = (min.y - ray.origin.y) / ray.direction.y;
        let tymax = (max.y - ray.origin.y) / ray.direction.y;
        if (tymin > tymax) [tymin, tymax] = [tymax, tymin];

        if ((tmin > tymax) || (tymin > tmax)) return false;

        if (tymin > tmin) tmin = tymin;
        if (tymax < tmax) tmax = tymax;

        let tzmin = (min.z - ray.origin.z) / ray.direction.z;
        let tzmax = (max.z - ray.origin.z) / ray.direction.z;
        if (tzmin > tzmax) [tzmin, tzmax] = [tzmax, tzmin];

        if ((tmin > tzmax) || (tzmin > tmax)) return false;

        // jeśli potrzebujesz odległość do trafienia:
        // return tmin >= 0 ? tmin : tmax;

        return true;
    }

    Intersects(otherBounds) {
        const aMin = this.min;
        const aMax = this.max;
        const bMin = otherBounds.min;
        const bMax = otherBounds.max;

        return (aMin.x <= bMax.x && aMax.x >= bMin.x) && (aMin.y <= bMax.y && aMax.y >= bMin.y) && (aMin.z <= bMax.z && aMax.z >= bMin.z);
    }

    SetMinMax(min, max) {
        this.center = Vector3.Multiply(Vector3.Add(min, max), 0.5);
        this.extents = Vector3.Subtract(max, min).Divide(2);
        return this;
    }

    SqrDistance(point) {
        return null;
    }

    ToString() {
        return Json.ToJson(this);
    }

    Set(center, size) {
        this[0] = center.x;
        this[1] = center.y;
        this[2] = center.z;

        this[3] = size.x;
        this[4] = size.y;
        this[5] = size.z;
    }

    Clear() { this[0] = 0; this[1] = 0; this[2] = 0; this[3] = 0; this[4] = 0; this[5] = 0; }
    Clone() { return new Bounds(this.center.Clone(), this.size.Clone()); }

}