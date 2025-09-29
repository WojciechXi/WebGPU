class SphereCollider extends Collider {

    Init() {
        super.Init();
        this.radius = 0.5;
    }

    Intersects(other) {
        if (other instanceof SphereCollider) {
            const posA = this.transform.position;
            const posB = other.transform.position;
            const distSqr = posA.Subtract(posB).LengthSquared();
            const rSum = this.radius + other.radius;
            return distSqr <= rSum * rSum;
        } else if (other instanceof BoxCollider) {
            const spherePos = this.transform.position;
            const boxMin = other.GetMin();
            const boxMax = other.GetMax();

            const x = Math.max(boxMin.x, Math.min(spherePos.x, boxMax.x));
            const y = Math.max(boxMin.y, Math.min(spherePos.y, boxMax.y));
            const z = Math.max(boxMin.z, Math.min(spherePos.z, boxMax.z));

            const closest = new Vector3(x, y, z);
            const delta = spherePos.Subtract(closest);
            return delta.LengthSquared() <= this.radius * this.radius;
        } else if (other instanceof CapsuleCollider) {
            return other.Intersects(this);
        }
        return false;
    }

}