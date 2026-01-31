class Transform extends Component {

    get childCount() { return this.children.length; }

    // ---------- World Gettery / Settery ----------

    get localEulerAngles() { return Quaternion.ToEuler(this.localRotation); }
    set localEulerAngles(localEulerAngles) { this.localRotation = Quaternion.Euler(localEulerAngles); }

    get eulerAngles() { return Quaternion.ToEuler(this.rotation); }
    set eulerAngles(value) { this.rotation = Quaternion.Euler(value.x, value.y, value.z); }

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

    get forward() { return Quaternion.MultiplyVector3(this.rotation, Vector3.forward); }
    get right() { return Quaternion.MultiplyVector3(this.rotation, Vector3.right); }
    get up() { return Quaternion.MultiplyVector3(this.rotation, Vector3.up); }
    get back() { return this.forward.Negate(); }
    get left() { return this.forward.Negate(); }
    get down() { return this.forward.Negate(); }

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

    // ---------- Hierarchia ----------
    SetParent(newParent) {
        const position = this.position;
        const rotation = this.rotation;

        if (this.parent) {
            const index = this.parent.children.indexOf(this);
            if (index !== -1) this.parent.children.splice(index, 1);
        }

        this.parent = newParent;
        if (newParent) newParent.children.push(this);

        this.position = position;
        this.rotation = rotation;
    }

    ClearParent() { this.SetParent(null); }

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

    Translate(translation, relativeTo = "self") {
        if (relativeTo === "self") this.position = this.TransformPoint(translation);
        else this.position = Vector3.Add(this.position, translation);
    }

    TransformRay(localRay) { return new Ray(this.TransformPoint(localRay.origin), this.TransformDirection(localRay.direction)); }
    InverseTransformRay(worldRay) { return new Ray(this.InverseTransformPoint(worldRay.origin), this.InverseTransformDirection(worldRay.direction)); }

}
