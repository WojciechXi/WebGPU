class Collider extends Component {

    static {
        this.colliders = [];
    }

    Init() {
        Collider.colliders.push(this);

        this.center = Vector3.zero;

        this.isTrigger = false; // Jeśli true, kolizja nie wpływa fizycznie
        this._collidingWith = new Set(); // set aktualnych kolizji
    }

    get worldCenter() {
        return Vector3.Add(this.transform.position, this.center);
    }

    get bounds() {
        return new Bounds(this.worldCenter, Vector3.zero);
    }

    OnCollisionEnter(otherCollider) { }
    OnCollisionStay(otherCollider) { }
    OnCollisionExit(otherCollider) { }

    Intersects(otherCollider) {
        return false;
    }

    ComputePenetration(otherCollider) {
        return null;
    }

    ClosestPoint() { } // Todo
    ClosestPointOnBounds() { } // Todo
    GetGeometry() { } // Todo
    Raycast() { } // Todo

}