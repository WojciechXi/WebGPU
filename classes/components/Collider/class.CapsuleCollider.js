class CapsuleCollider extends Collider {

    static ClosestPointOnSegment(a, b, p) {
        const ab = Vector3.Subtract(b, a);
        const t = (Vector3.Subtract(p, a)).Dot(ab) / ab.Dot(ab);
        const clampedT = Math.max(0, Math.min(1, t));
        return Vector3.Add(a, Vector3.Multiply(ab, clampedT));
    }


    Init() {
        super.Init();
        this.radius = 0.5;
        this.height = 2.0; // odległość między końcami kapsuły
    }

    get bounds() {
        return new Bounds(this.worldCenter, new Vector3(this.radius * 2, this.height, this.radius * 2));
    }

    // Punkty końcowe kapsuły w world space
    GetTop() {
        return Vector3.Add(this.worldCenter, new Vector3(0, this.height * 0.5, 0));
    }

    GetBottom() {
        return Vector3.Add(this.worldCenter, new Vector3(0, -this.height * 0.5, 0));
    }

    Intersects(otherCollider) {
        if (otherCollider instanceof SphereCollider) {
            // Najbliższy punkt segmentu kapsuły do sfery
            const position = otherCollider.transform.position;
            const top = this.GetTop();
            const bottom = this.GetBottom();
            const closest = CapsuleCollider.ClosestPointOnSegment(bottom, top, position);
            const delta = Vector3.Subtract(position, closest);

            return delta.SqrMagnitude() <= otherCollider.radius * otherCollider.radius;
        } else if (otherCollider instanceof CapsuleCollider) {
            // Prosta kolizja capsule-capsule: dystans między segmentami < sum radius
            const aTop = this.GetTop();
            const aBottom = this.GetBottom();
            const bTop = otherCollider.GetTop();
            const bBottom = otherCollider.GetBottom();

            const closestA = CapsuleCollider.ClosestPointOnSegment(aBottom, aTop, bBottom);
            const closestB = CapsuleCollider.ClosestPointOnSegment(bBottom, bTop, closestA);

            const delta = Vector3.Subtract(closestA, closestB);
            return delta.SqrMagnitude() <= (this.radius + otherCollider.radius) ** 2;
        } else if (otherCollider instanceof BoxCollider) {

        }
        return false;
    }

    ComputePenetration(otherCollider) {
        if (otherCollider instanceof CapsuleCollider && this.axis === 'Y' && otherCollider.axis === 'Y') {
            const position = this.transform.position;
            const otherColliderPosition = otherCollider.transform.position;

            const p1a = Vector3.Add(position, new Vector3(0, this.height / 2 - this.radius, 0));
            const p2a = Vector3.Subtract(position, new Vector3(0, this.height / 2 - this.radius, 0));

            const p1b = Vector3.Add(otherColliderPosition, new Vector3(0, otherCollider.height / 2 - otherCollider.radius, 0));
            const p2b = Vector3.Subtract(otherColliderPosition, new Vector3(0, otherCollider.height / 2 - otherCollider.radius, 0));

            // najbliższe punkty między odcinkami
            const closestA = Vector3.ClosestPointOnSegment(p1a, p2a, otherColliderPosition);
            const closestB = Vector3.ClosestPointOnSegment(p1b, p2b, position);

            const delta = Vector3.Subtract(closestA, closestB);
            const dist = delta.Magnitude();
            const minDist = this.radius + otherCollider.radius;

            if (dist < minDist) {
                const normal = dist > 0 ? delta.Normalize() : new Vector3(1, 0, 0);
                const depth = minDist - dist;
                return Vector3.Multiply(normal, depth);
            }
        }
        return null;
    }

}