class Bounds {

    static FromMinMax(min, max) {
        const center = Vector3.Multiply(Vector3.Add(min, max), 0.5);
        const size = Vector3.Subtract(max, min);
        return new Bounds(center, size);
    }

    constructor(center, size) {
        this.center = new Vector3(center.x, center.y, center.z);
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


}