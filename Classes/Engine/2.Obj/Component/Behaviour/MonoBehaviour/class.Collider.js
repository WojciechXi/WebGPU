class Collider extends MonoBehaviour {

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

    UpdateC() {
        const newColliding = new Set();

        for (const otherCollider of Collider.colliders) {
            if (otherCollider === this) continue;
            if (this.Intersects(otherCollider)) newColliding.add(otherCollider);
        }

        // OnCollisionEnter
        for (const otherCollider of newColliding) {
            if (!this._collidingWith.has(otherCollider)) this.OnCollisionEnter(otherCollider);
            else this.OnCollisionStay(otherCollider);
        }

        // OnCollisionExit
        for (const otherCollider of this._collidingWith) {
            if (!newColliding.has(otherCollider)) this.OnCollisionExit(otherCollider);
        }

        this._collidingWith = newColliding;
    }

}