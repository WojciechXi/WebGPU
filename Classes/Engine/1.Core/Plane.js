class Plane {

    // Statyczne fabryki
    static FromInNormalDistance(inNormal, distance) {
        const length = Mathf.Sqrt(inNormal.x ** 2 + inNormal.y ** 2 + inNormal.z ** 2);
        return new Plane(
            new Vector3(inNormal.x / length, inNormal.y / length, inNormal.z / length),
            distance / length
        );
    }

    static FromABC(a, b, c, d) {
        return new Plane(new Vector3(a, b, c), d);
    }

    // Gettery i Settery
    get distance() { return this._distance; }
    set distance(value) { this._distance = value; }

    get normal() { return this._normal; }
    set normal(value) { this._normal = value; }

    get flipped() {
        return new Plane(
            new Vector3(-this.normal.x, -this.normal.y, -this.normal.z),
            -this.distance
        );
    }

    // Constructors
    constructor(normal, distance) {
        this._normal = normal;
        this._distance = distance;
    }

    // Publiczne Metody
    ClosestPointOnPlane(point) {
        const dist = this.GetDistanceToPoint(point);
        return new Vector3(
            point.x - this.normal.x * dist,
            point.y - this.normal.y * dist,
            point.z - this.normal.z * dist
        );
    }

    Flip() {
        this.normal.x *= -1;
        this.normal.y *= -1;
        this.normal.z *= -1;
        this.distance *= -1;
    }

    GetDistanceToPoint(point) {
        return (this.normal.x * point.x + this.normal.y * point.y + this.normal.z * point.z) + this.distance;
    }

    GetSide(point) {
        return this.GetDistanceToPoint(point) >= 0;
    }

    Raycast(rayOrigin, rayDirection) {
        const denom = this.normal.x * rayDirection.x + this.normal.y * rayDirection.y + this.normal.z * rayDirection.z;
        if (Mathf.Abs(denom) < 1e-6) return null;

        const t = -(this.normal.x * rayOrigin.x + this.normal.y * rayOrigin.y + this.normal.z * rayOrigin.z + this.distance) / denom;
        return t >= 0 ? t : null;
    }

    SameSide(pointA, pointB) {
        const d1 = this.GetDistanceToPoint(pointA);
        const d2 = this.GetDistanceToPoint(pointB);
        return (d1 >= 0 && d2 >= 0) || (d1 < 0 && d2 < 0);
    }

    Set3Points(a, b, c) {
        const v0 = new Vector3(b.x - a.x, b.y - a.y, b.z - a.z);
        const v1 = new Vector3(c.x - a.x, c.y - a.y, c.z - a.z);

        const nx = v0.y * v1.z - v0.z * v1.y;
        const ny = v0.z * v1.x - v0.x * v1.z;
        const nz = v0.x * v1.y - v0.y * v1.x;

        this.normal = new Vector3(nx, ny, nz).normalized;
        this.distance = -(this.normal.x * a.x + this.normal.y * a.y + this.normal.z * a.z);
    }

    SetNormalAndPosition(normal, point) {
        this.normal = normal;
        this.distance = -(normal.x * point.x + normal.y * point.y + normal.z * point.z);
    }

    Translate(translation) {
        this.distance -= (this.normal.x * translation.x + this.normal.y * translation.y + this.normal.z * translation.z);
    }
}