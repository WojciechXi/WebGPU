class BoxCollider extends Collider {

    Init() {
        super.Init();
        this.size = Vector3.one; // rozmiar boxa w lokalnej skali
    }

    get bounds() {
        let size = Vector3.Scale(this.size, this.transform.lossyScale);

        return new Bounds(this.worldCenter, size);
    }

    Intersects(otherCollider) {
        if (otherCollider instanceof BoxCollider) {
            return this.bounds.Intersects(otherCollider.bounds);
        } else if (otherCollider instanceof SphereCollider || otherCollider instanceof CapsuleCollider) {
            return otherCollider.Intersects(this);
        }
        return false;
    }

    ComputePenetration(otherCollider) {
        if (otherCollider instanceof BoxCollider) {
            let bounds = this.bounds;
            let otherColliderBounds = otherCollider.bounds;

            const aMin = bounds.min;
            const aMax = bounds.max;

            const bMin = otherColliderBounds.min;
            const bMax = otherColliderBounds.max;

            // overlap po osiach
            const dx = Mathf.Min(aMax.x, bMax.x) - Mathf.Max(aMin.x, bMin.x);
            const dy = Mathf.Min(aMax.y, bMax.y) - Mathf.Max(aMin.y, bMin.y);
            const dz = Mathf.Min(aMax.z, bMax.z) - Mathf.Max(aMin.z, bMin.z);

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
        } else if (otherCollider instanceof SphereCollider) {
            return otherCollider.ComputePenetration(this);
        }

        return null;
    }


}