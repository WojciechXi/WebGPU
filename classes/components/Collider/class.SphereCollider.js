class SphereCollider extends Collider {

    Init() {
        super.Init();
        this.radius = 0.5;
    }

    Intersects(other) {
        if (other instanceof SphereCollider) {
            const position = this.transform.position;
            const otherPosition = other.transform.position;

            const distSqr = Vector3.Subtract(position, otherPosition).SqrMagnitude();
            const rSum = this.radius + other.radius;

            return distSqr <= rSum * rSum;
        } else if (other instanceof BoxCollider) {
            const position = this.transform.position;

            const boxMin = other.GetMin();
            const boxMax = other.GetMax();

            const x = Math.max(boxMin.x, Math.min(position.x, boxMax.x));
            const y = Math.max(boxMin.y, Math.min(position.y, boxMax.y));
            const z = Math.max(boxMin.z, Math.min(position.z, boxMax.z));

            const closest = new Vector3(x, y, z);
            const delta = Vector3.Subtract(position, closest);

            return delta.SqrMagnitude() <= this.radius * this.radius;
        } else if (other instanceof CapsuleCollider) {
            return other.Intersects(this);
        }
        return false;
    }

    ComputePenetration(other) {
        if (other instanceof SphereCollider) {
            const position = this.transform.position;
            const delta = Vector3.Subtract(position, other.transform.position);
            const dist = delta.Magnitude();
            const minDist = this.radius + other.radius;

            if (dist < minDist) {
                const normal = dist > 0 ? delta.Normalize() : new Vector3(1, 0, 0);
                const depth = minDist - dist;
                return Vector3.Multiply(normal, depth);
            }
        }

        return null;
    }


}