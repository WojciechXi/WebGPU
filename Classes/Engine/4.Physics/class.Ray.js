class Ray {

    constructor(origin, direction) {
        this.origin = origin;
        this.direction = direction;
    }

    GetPoint(distance) { return Vector3.Add(this.origin, Vector3.Multiply(this.direction, distance)); }
    ToString() { return Json.ToJson(this); }

}