class BoxCollider extends Collider {

    Init() {
        super.Init();
        this.size = Vector3.one; // rozmiar boxa w lokalnej skali
    }

    // AABB w world space
    GetMin() {
        return Vector3.Subtract(this.transform.position, Vector3.Multiply(this.size, 0.5));
    }

    GetMax() {
        return Vector3.Add(this.transform.position, Vector3.Multiply(this.size, 0.5));
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

    ComputePenetration(other) {
        if (other instanceof BoxCollider) {
            const aMin = this.GetMin();
            const aMax = this.GetMax();

            const bMin = other.GetMin();
            const bMax = other.GetMax()

            // overlap po osiach
            const dx = Math.min(aMax.x, bMax.x) - Math.max(aMin.x, bMin.x);
            const dy = Math.min(aMax.y, bMax.y) - Math.max(aMin.y, bMin.y);
            const dz = Math.min(aMax.z, bMax.z) - Math.max(aMin.z, bMin.z);

            if (dx > 0 && dy > 0 && dz > 0) {
                // najmniejszy overlap → to będzie oś korekcji
                if (dx < dy && dx < dz) {
                    return new Vector3(aMax.x > bMax.x ? dx : -dx, 0, 0);
                } else if (dy < dz) {
                    return new Vector3(0, aMax.y > bMax.y ? dy : -dy, 0);
                } else {
                    return new Vector3(0, 0, aMax.z > bMax.z ? dz : -dz);
                }
            }
        }

        return null;
    }


}