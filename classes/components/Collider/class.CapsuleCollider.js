class CapsuleCollider extends Collider {

    Init() {
        super.Init();
        this.radius = 0.5;
        this.height = 2.0; // odległość między końcami kapsuły
    }

    // Punkty końcowe kapsuły w world space
    GetTop() {
        const pos = this.transform.position;
        return pos.Add(new Vector3(0, this.height * 0.5, 0));
    }

    GetBottom() {
        const pos = this.transform.position;
        return pos.Add(new Vector3(0, -this.height * 0.5, 0));
    }

    Intersects(other) {
        if (other instanceof SphereCollider) {
            // Najbliższy punkt segmentu kapsuły do sfery
            const spherePos = other.transform.position;
            const top = this.GetTop();
            const bottom = this.GetBottom();
            const closest = CapsuleCollider.ClosestPointOnSegment(bottom, top, spherePos);
            const delta = spherePos.Subtract(closest);
            return delta.LengthSquared() <= other.radius * other.radius;
        } else if (other instanceof CapsuleCollider) {
            // Prosta kolizja capsule-capsule: dystans między segmentami < sum radius
            const aTop = this.GetTop();
            const aBottom = this.GetBottom();
            const bTop = other.GetTop();
            const bBottom = other.GetBottom();

            const closestA = CapsuleCollider.ClosestPointOnSegment(aBottom, aTop, bBottom);
            const closestB = CapsuleCollider.ClosestPointOnSegment(bBottom, bTop, closestA);
            const delta = closestA.Subtract(closestB);
            return delta.LengthSquared() <= (this.radius + other.radius) ** 2;
        } else if (other instanceof BoxCollider || other instanceof SphereCollider) {
            return other.Intersects(this);
        }
        return false;
    }

    static ClosestPointOnSegment(a, b, p) {
        const ab = b.Subtract(a);
        const t = Math.max(0, Math.min(1, p.Subtract(a).Dot(ab) / ab.LengthSquared()));
        return a.Add(ab.Multiply(t));
    }

}