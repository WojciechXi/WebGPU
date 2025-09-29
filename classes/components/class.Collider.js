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

    OnCollisionEnter(other) { }
    OnCollisionStay(other) { }
    OnCollisionExit(other) { }

    Intersects(other) {
        return false;
    }

    ComputePenetration(other) {
        return null;
    }

    ClosestPoint() { } // Todo
    ClosestPointOnBounds() { } // Todo
    GetGeometry() { } // Todo
    Raycast() { } // Todo

    UpdateC() {
        const newColliding = new Set();

        for (const other of Collider.colliders) {
            if (other === this) continue;
            if (this.Intersects(other)) newColliding.add(other);
        }

        // OnCollisionEnter
        for (const other of newColliding) {
            if (!this._collidingWith.has(other)) this.OnCollisionEnter(other);
            else this.OnCollisionStay(other);
        }

        // OnCollisionExit
        for (const other of this._collidingWith) {
            if (!newColliding.has(other)) this.OnCollisionExit(other);
        }

        this._collidingWith = newColliding;
    }

}