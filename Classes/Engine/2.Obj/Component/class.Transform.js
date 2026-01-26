class Transform extends Component {

    Init() {
        this.localPosition = Vector3.zero;
        this.localRotation = Quaternion.identity;
        this.localScale = Vector3.one;

        this.parent = null;
        this.children = [];

        this.transformBuffer = new Buffer(16, { usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST }); //matrix4x4
    }

    Update() {
        this.transformBuffer.Set({
            0: this.matrix4x4,
        });
    }

    get childCount() { return this.children.length; }

    // ---------- Hierarchia ----------
    SetParent(newParent) {
        if (this.parent) {
            const index = this.parent.children.indexOf(this);
            if (index !== -1) this.parent.children.splice(index, 1);
        }
        this.parent = newParent;
        if (newParent) newParent.children.push(this);
    }

    ClearParent() { this.SetParent(null); }

    // ---------- World Gettery / Settery ----------

    get localEulerAngles() { return Quaternion.ToEuler(this.localRotation); }
    set localEulerAngles(localEulerAngles) { this.localRotation = Quaternion.FromEuler(localEulerAngles); }

    get eulerAngles() { return this.parent ? Quaternion.Multiply(this.parent.eulerAngles, this.localRotation) : Quaternion.ToEuler(this.localRotation); }
    set eulerAngles(eulerAngles) {
        if (!this.parent) this.localRotation = Quaternion.FromEuler(eulerAngles);
    }

    get position() {
        if (!this.parent) return this.localPosition.Clone();

        const p = Vector3.Scale(this.localPosition, this.parent.scale);
        Quaternion.MultiplyVector3(this.parent.rotation, p, p);
        return p.Add(this.parent.position);
    }
    set position(value) { this.localPosition = this.parent ? this.parent.InverseTransformPoint(value) : value.Clone(); }

    get rotation() { return this.parent ? Quaternion.Multiply(this.parent.rotation, this.localRotation) : this.localRotation.Clone(); }
    set rotation(value) { this.localRotation = this.parent ? this.localRotation = this.parent.rotation.Inverse().Multiply(value) : value.Clone() }

    get scale() { return this.parent ? this.parent.scale.Scale(this.localScale) : this.localScale.Clone(); }

    get matrix4x4() {
        const m = Matrix4x4.TRS(this.localPosition, this.localRotation, this.localScale);
        return this.parent ? Matrix4x4.Multiply(this.parent.matrix4x4, m) : m;
    }

    get forward() {
        const m = this.matrix4x4;
        const v = new Vector3(m[8], m[9], m[10]);
        return v.Normalize();
    }
    get right() {
        const m = this.matrix4x4;
        const v = new Vector3(m[0], m[1], m[2]); // X kolumna
        return v.Normalize();
    }
    get up() {
        const m = this.matrix4x4;
        const v = new Vector3(m[4], m[5], m[6]); // Y kolumna
        return v.Normalize();
    }
    get back() { return Vector3.Multiply(this.forward, -1); }
    get left() { return Vector3.Multiply(this.right, -1); }
    get down() { return Vector3.Multiply(this.up, -1); }

    InverseTransformDirection(worldDirection) {
        const newDirection = Quaternion.MultiplyVector3(this.rotation.Inverse(), worldDirection);
        return newDirection.Unscale(this.scale);
    }
    InverseTransformDirections(directions) { return directions.map(d => this.InverseTransformDirection(d)); }

    InverseTransformPoint(worldPoint) {
        const newPoint = Vector3.Sub(worldPoint, this.position);
        Quaternion.MultiplyVector3(this.rotation.Inverse(), newPoint, newPoint);
        return newPoint.Unscale(this.scale);
    }
    InverseTransformPoints(points) { return points.map(p => this.InverseTransformPoint(p)); }

    TransformDirection(localDirection) {
        const newDirection = Vector3.Scale(localDirection, this.scale);
        return Quaternion.MultiplyVector3(this.rotation, newDirection, newDirection);
    }
    TransformDirections(directions) { return directions.map(d => this.TransformDirection(d)); }

    TransformPoint(localPoint) {
        const newPoint = Vector3.Scale(localPoint, this.scale);
        Quaternion.MultiplyVector3(this.rotation, newPoint, newPoint);
        return newPoint.Add(this.position);
    }
    TransformPoints(points) { return points.map(p => this.TransformPoint(p)); }

    TransformVector(vector) {
        const newVector = Vector3.Scale(vector, this.scale);
        return Quaternion.MultiplyVector3(this.rotation, newVector, newVector);
    }
    TransformVectors(vectors) { return vectors.map(v => this.TransformVector(v)); }

    Translate(vector) {
        const delta = Vector3.Scale(vector, this.parent.scale);
        Quaternion.MultiplyVector3(this.parent.rotation, delta, delta);
        this.parent.position.Add(delta);
        //Todo set new position
    }

    TransformRay(localRay) { return new Ray(this.TransformPoint(localRay.origin), this.TransformDirection(localRay.direction)); }
    InverseTransformRay(worldRay) { return new Ray(this.InverseTransformPoint(worldRay.origin), this.InverseTransformDirection(worldRay.direction)); }

}
