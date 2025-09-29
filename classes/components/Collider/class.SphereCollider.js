class SphereCollider extends Collider {

    Init() {
        super.Init();
        this.radius = 0.5;
    }

    get bounds() {
        return new Bounds(this.worldCenter, Vector3.Multiply(Vector3.one, this.radius));
    }

    Intersects(other) {
        if (other instanceof TerrainCollider) {
            other.Intersects(this);
        } else if (other instanceof SphereCollider) {
            const worldCenter = this.worldCenter;
            const otherWorldCenter = other.worldCenter;

            const distSqr = Vector3.Subtract(worldCenter, otherWorldCenter).SqrMagnitude();
            const rSum = this.radius + other.radius;

            return distSqr <= rSum * rSum;
        } else if (other instanceof BoxCollider) {
            const worldCenter = this.worldCenter;

            const otherBounds = other.bounds;
            const boxMin = otherBounds.min;
            const boxMax = otherBounds.max;

            const x = Math.max(boxMin.x, Math.min(worldCenter.x, boxMax.x));
            const y = Math.max(boxMin.y, Math.min(worldCenter.y, boxMax.y));
            const z = Math.max(boxMin.z, Math.min(worldCenter.z, boxMax.z));

            const closest = new Vector3(x, y, z);
            const delta = Vector3.Subtract(worldCenter, closest);

            return delta.SqrMagnitude() <= this.radius * this.radius;
        } else if (other instanceof CapsuleCollider) {
            return other.Intersects(this);
        }
        return false;
    }

    ComputePenetration(other) {
        if (other instanceof TerrainCollider) {
            other.ComputePenetration(this);
        } else if (other instanceof SphereCollider) {
            const worldCenter = this.worldCenter;
            const delta = Vector3.Subtract(worldCenter, other.worldCenter);
            const dist = delta.Magnitude();
            const minDist = this.radius + other.radius;

            if (dist < minDist) {
                const normal = dist > 0 ? delta.Normalize() : new Vector3(1, 0, 0);
                const depth = minDist - dist;
                return Vector3.Multiply(normal, depth);
            }
        } else if (other instanceof BoxCollider) {
            const worldCenter = this.worldCenter;
            const otherBounds = other.bounds;

            const boxMin = otherBounds.min;
            const boxMax = otherBounds.max;

            // clamp sphere center to box
            const closest = new Vector3(
                Math.max(boxMin.x, Math.min(worldCenter.x, boxMax.x)),
                Math.max(boxMin.y, Math.min(worldCenter.y, boxMax.y)),
                Math.max(boxMin.z, Math.min(worldCenter.z, boxMax.z))
            );

            const delta = Vector3.Subtract(worldCenter, closest);
            const dist = delta.Magnitude();

            if (dist < this.radius) {
                const normal = dist > 0 ? delta.Normalize() : new Vector3(1, 0, 0);
                const depth = this.radius - dist;
                return Vector3.Multiply(normal, depth);
            }
        }

        return null;
    }


}