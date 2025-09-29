class Bounds {

    static FromMinMax(min, max) {
        const center = Vector3.Multiply(Vector3.Add(min, max), 0.5);
        const size = Vector3.Subtract(max, min);
        return new Bounds(center, size);
    }

    static Contains(bounds, point) {
        const min = bounds.min;
        const max = bounds.max;

        return (point.x >= min.x && point.x <= max.x &&
            point.y >= min.y && point.y <= max.y &&
            point.z >= min.z && point.z <= max.z);
    }

    static Intersects(a, b) {
        const aMin = a.min, aMax = a.max;
        const bMin = b.min, bMax = b.max;

        return (aMin.x <= bMax.x && aMax.x >= bMin.x) &&
            (aMin.y <= bMax.y && aMax.y >= bMin.y) &&
            (aMin.z <= bMax.z && aMax.z >= bMin.z);
    }

    constructor(center, size) {
        this.center = center.Clone();
        this.extends = Vector3.Multiply(size, 0.5);
    }

    get min() {
        return Vector3.Subtract(this.center, this.extents);
    }

    get max() {
        return Vector3.Add(this.center, this.extents);
    }

    get size() {
        return Vector3.Multiply(this.extents, 2);
    }

}