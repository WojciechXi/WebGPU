class CapsuleCollider extends BoxCollider {

    Init() {
        super.Init();
        this.center = Vector3.zero;
        this.radius = 0.5;
        this.height = 2.0; // odległość między końcami kapsuły

        this.size.x = this.size.z = this.radius * 2;
        this.size.y = this.height;
    }

    get bottom() { return Vector3.Sub(this.center, new Vector3(0, this.height / 2 - this.radius, 0)); }
    get top() { return Vector3.Add(this.center, new Vector3(0, this.height / 2 - this.radius, 0)); }

    get worldCenter() { return this.transform.TransformPoint(this.center); }
    get localBounds() { return new Bounds(this.center, new Vector3(this.radius * 2, this.height, this.radius * 2)); }
    get bounds() {
        const hx = this.radius;
        const hy = this.height / 2;
        const hz = this.radius;

        return GeometryUtility.CalculateBounds([
            new Vector3(this.center.x + hx, this.center.y + hy, this.center.z + hz),
            new Vector3(this.center.x + hx, this.center.y + hy, this.center.z - hz),
            new Vector3(this.center.x + hx, this.center.y - hy, this.center.z + hz),
            new Vector3(this.center.x + hx, this.center.y - hy, this.center.z - hz),
            new Vector3(this.center.x - hx, this.center.y + hy, this.center.z + hz),
            new Vector3(this.center.x - hx, this.center.y + hy, this.center.z - hz),
            new Vector3(this.center.x - hx, this.center.y - hy, this.center.z + hz),
            new Vector3(this.center.x - hx, this.center.y - hy, this.center.z - hz),
        ], this.transform.matrix4x4);
    }

    // Punkty końcowe kapsuły w world space
    GetWorldTop() {
        return Vector3.Add(this.worldCenter, new Vector3(0, this.height / 2, 0));
    }

    GetWorldBottom() {
        return Vector3.Sub(this.worldCenter, new Vector3(0, this.height / 2, 0));
    }

    ClosestPointOnSegment(position) { return CapsuleCollider.ClosestPointOnSegment(this.top, this.bottom, position); }
    static ClosestPointOnSegment(top, bottom, position) {
        const ab = Vector3.Subtract(bottom, top);
        const t = (Vector3.Subtract(position, top)).Dot(ab) / ab.Dot(ab);
        const clampedT = Mathf.Clamp(t, 0, 1);
        return Vector3.Add(top, Vector3.Multiply(ab, clampedT));
    }

    OnDrawGizmos(renderPass, camera) {
        renderPass.DrawRay(new Ray(this.transform.position, this.transform.forward));
        renderPass.DrawSphere(this.worldCenter.Subtract(new Vector3(0, this.height / 2 - this.radius, 0)), this.radius, this.transform.rotation);
        renderPass.DrawSphere(this.worldCenter.Add(new Vector3(0, this.height / 2 - this.radius, 0)), this.radius, this.transform.rotation);

        let bounds = this.bounds;
        let matrix = Matrix4x4.TRS(bounds.center, Quaternion.identity, bounds.size);
        renderPass.DrawMesh(Graphics.cubeMesh, 0, matrix);
    }

}