class Collider extends Component {

    Init() {
        this.center = Vector3.zero;

        this.isTrigger = false; // Jeśli true, kolizja nie wpływa fizycznie
        this._collidingWith = new Set(); // set aktualnych kolizji
    }

    get worldCenter() {
        return Vector3.Add(this.transform.position, Vector3.Scale(this.center, this.transform.scale));
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

    ClosestPoint(position) { } // Todo
    ClosestPointOnBounds(position) { } // Todo
    GetGeometry() { } // Todo
    Raycast(ray, maxDistance) {
        return null;
    }

}