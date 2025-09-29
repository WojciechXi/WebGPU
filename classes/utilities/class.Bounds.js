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

    static Intersects(bounds, other) {
        const aMin = bounds.min, aMax = bounds.max;
        const bMin = other.min, bMax = other.max;

        return (aMin.x <= bMax.x && aMax.x >= bMin.x) &&
            (aMin.y <= bMax.y && aMax.y >= bMin.y) &&
            (aMin.z <= bMax.z && aMax.z >= bMin.z);
    }

    constructor(center, size) {
        this.center = center.Clone();
        this.extends = Vector3.Multiply(size, 0.5);
    }

    get min() {
        return Vector3.Subtract(this.center, this.extends);
    }

    get max() {
        return Vector3.Add(this.center, this.extends);
    }

    get size() {
        return Vector3.Multiply(this.extends, 2);
    }

    ClosestPoint(point) {
        return Bounds.ClosestPoint(this, point);
    }

    Contains(point) {
        return Bounds.Contains(this, point);
    }

    Encapsulate(point) {
        return Bounds.Encapsulate(this, point);
    }

    Expand(amount) {
        return Bounds.Expand(this, amount);
    }

    IntersectRay(ray) {
        return Bounds.IntersectRay(this, ray);
    }

    Intersects(bounds) {
        return Bounds.Intersects(this, bounds);
    }

    SetMinMax(min, max) {
        return Bounds.SetMinMax(this, min, max);
    }

    SqrDistance(point) {
        return Bounds.SqrDistance(this, point);
    }


}