class Collider extends Component {

    Init() {
        this.isTrigger = false; // Jeśli true, kolizja nie wpływa fizycznie
        this._collidingWith = new Set(); // set aktualnych kolizji
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
        return false;
    }

    ClosestPoint(position) { } // Todo
    ClosestPointOnBounds(position) { } // Todo
    GetGeometry() { } // Todo
    Raycast(ray, maxDistance) { return null; }

    ComputePenetration(otherCollider) {
        return null;
    }

}