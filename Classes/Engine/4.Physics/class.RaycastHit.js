class RaycastHit {

    constructor(collider, point, normal, distance) {
        this.collider = collider;
        this.gameObject = collider.gameObject;
        this.transform = collider.transform;
        this.rigidbody = collider.GetComponent(Rigidbody);

        this.point = point;
        this.normal = normal;
        this.distance = distance;
    }

}