class Collider extends Component {

    constructor() {
        super();
        const object = this;

        new Property(object, 'material', null);
        new Property(object, 'isTrigger', false);
        new Property(object, 'provideContact', false);
        new Property(object, 'collidingWith', new Set());
    }

    get localBounds() { return new Bounds(Vector3.zero, Vector3.zero); }
    get bounds() { return new Bounds(this.transform.position, Vector3.zero); }
    get worldCenter() { return Vector3.zero; }
    get material() { return PhysicMaterial.Default; }

    // Messages
    // OnCollisionEnter(collision) { }
    // OnCollisionStay(collision) { }
    // OnCollisionExit(collision) { }
    // OnTriggerEnter(collider) { }
    // OnTriggerExit(collider) { }
    // OnTriggerStay(collider) { }

    Intersects(otherCollider) {
        if (!otherCollider) return false;
        return this.bounds.Intersects(otherCollider.bounds);
    }

    ClosestPoint(position) { } // Todo
    ClosestPointOnBounds(position) { return this.bounds.ClosestPoint(position); }
    GetGeometry() { return null; }
    Raycast(ray, maxDistance) { return null; }

    ComputePenetration(otherCollider) {
        return null;
    }

}