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
    ClosestPoint(point) { }

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
        return null;
    }

    Intersects(otherBounds) {
        const aMin = this.min, aMax = this.max;
        const bMin = otherBounds.min, bMax = otherBounds.max;

        return (aMin.x <= bMax.x && aMax.x >= bMin.x) &&
            (aMin.y <= bMax.y && aMax.y >= bMin.y) &&
            (aMin.z <= bMax.z && aMax.z >= bMin.z);
    }

    SetMinMax(min, max) {
        return null;
    }

    SqrDistance(point) {
        return null;
    }

    ToString() {
        return JSON.stringify(this);
    }


}