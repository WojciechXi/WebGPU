class Collider extends Component {

    Init() {
        this.center = Vector3.zero;

        this.isTrigger = false; // Jeśli true, kolizja nie wpływa fizycznie
        this._collidingWith = new Set(); // set aktualnych kolizji
    }

    get localBounds() { return new Bounds(this.center.Clone(), this.size.Clone()); }
    get bounds() { return new Bounds(Vector3.Add(this.transform.position, this.center), Vector3.zero); }
    get worldCenter() { return this.transform.TransformPoint(this.center); }

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
        const localRay = this.transform.InverseTransformRay(ray);
        return this.localBounds.IntersectRay(localRay);
    }

}