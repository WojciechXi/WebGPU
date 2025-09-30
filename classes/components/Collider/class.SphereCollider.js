class SphereCollider extends Collider {

    Init() {
        super.Init();
        this.radius = 0.5;
    }

    get bounds() {
        return new Bounds(this.worldCenter, Vector3.Multiply(Vector3.one, this.radius));
    }

    Intersects(otherCollider) {
        if (otherCollider instanceof TerrainCollider) {
            return otherCollider.Intersects(this);
        } else if (otherCollider instanceof SphereCollider) {
            const worldCenter = this.worldCenter;
            const otherColliderWorldCenter = otherCollider.worldCenter;

            const distSqr = Vector3.Subtract(worldCenter, otherColliderWorldCenter).sqrMagnitude;
            const rSum = this.radius + otherCollider.radius;

            return distSqr <= rSum * rSum;
        } else if (otherCollider instanceof BoxCollider) {
            const worldCenter = this.worldCenter;

            const otherColliderBounds = otherCollider.bounds;
            const boxMin = otherColliderBounds.min;
            const boxMax = otherColliderBounds.max;

            const x = Math.max(boxMin.x, Math.min(worldCenter.x, boxMax.x));
            const y = Math.max(boxMin.y, Math.min(worldCenter.y, boxMax.y));
            const z = Math.max(boxMin.z, Math.min(worldCenter.z, boxMax.z));

            const closest = new Vector3(x, y, z);
            const delta = Vector3.Subtract(worldCenter, closest);

            return delta.sqrMagnitude <= this.radius * this.radius;
        } else if (otherCollider instanceof CapsuleCollider) {
            return otherCollider.Intersects(this);
        }
        return false;
    }

    ComputePenetration(otherCollider) {
        if (otherCollider instanceof TerrainCollider) {
            return otherCollider.ComputePenetration(this);
        } else if (otherCollider instanceof SphereCollider) {
            const worldCenter = this.worldCenter;
            const delta = Vector3.Subtract(worldCenter, otherCollider.worldCenter);
            const dist = delta.magnitude;
            const minDist = this.radius + otherCollider.radius;

            if (dist < minDist) {
                const normal = dist > 0 ? delta.Normalize() : new Vector3(1, 0, 0);
                const depth = minDist - dist;
                return Vector3.Multiply(normal, depth);
            }
        } else if (otherCollider instanceof BoxCollider) {
            const worldCenter = this.worldCenter;
            const otherColliderBounds = otherCollider.bounds;

            const boxMin = otherColliderBounds.min;
            const boxMax = otherColliderBounds.max;

            // clamp sphere center to box
            const closest = new Vector3(
                Math.max(boxMin.x, Math.min(worldCenter.x, boxMax.x)),
                Math.max(boxMin.y, Math.min(worldCenter.y, boxMax.y)),
                Math.max(boxMin.z, Math.min(worldCenter.z, boxMax.z))
            );

            const delta = Vector3.Subtract(worldCenter, closest);
            const dist = delta.magnitude;

            if (dist < this.radius) {
                const normal = dist > 0 ? delta.Normalize() : new Vector3(1, 0, 0);
                const depth = this.radius - dist;
                return Vector3.Multiply(normal, depth);
            }
        }

        return null;
    }


}