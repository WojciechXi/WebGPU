class BoxCollider extends Collider {

    Init() {
        super.Init();
        this.size = Vector3.one; // rozmiar boxa w lokalnej skali
    }

    // AABB w world space
    GetMin() {
        const pos = this.transform.position;
        const half = this.size.Multiply(0.5);
        return pos.Subtract(half);
    }

    GetMax() {
        const pos = this.transform.position;
        const half = this.size.Multiply(0.5);
        return pos.Add(half);
    }

    Intersects(other) {
        if (other instanceof BoxCollider) {
            const aMin = this.GetMin();
            const aMax = this.GetMax();
            const bMin = other.GetMin();
            const bMax = other.GetMax();

            return (aMin.x <= bMax.x && aMax.x >= bMin.x) &&
                (aMin.y <= bMax.y && aMax.y >= bMin.y) &&
                (aMin.z <= bMax.z && aMax.z >= bMin.z);
        } else if (other instanceof SphereCollider || other instanceof CapsuleCollider) {
            return other.Intersects(this);
        }
        return false;
    }

}