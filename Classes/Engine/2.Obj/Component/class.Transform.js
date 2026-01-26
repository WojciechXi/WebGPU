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

    get position() { return this.parent ? this.parent.TransformPoint(this.localPosition) : this.localPosition.Clone(); }
    set position(value) { this.localPosition = this.parent ? this.parent.InverseTransformPoint(value) : value.Clone(); }

    get rotation() { return this.parent ? Quaternion.Multiply(this.parent.rotation, this.localRotation) : this.localRotation.Clone(); }
    set rotation(value) { this.localRotation = this.parent ? this.localRotation = this.parent.rotation.Inverse().Multiply(value) : value.Clone() }

    get scale() {
        return this.parent ? this.parent.scale.Scale(this.localScale) : this.localScale.Clone();
    }

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

    InverseTransformDirection(direction) {
        const rotation = this.rotation;
        const scale = this.scale;

        const newDirection = Quaternion.MultiplyVector3(rotation.Inverse(), direction);
        return newDirection.Unscale(scale);
    }
    InverseTransformDirections(directions) { return directions.map(d => this.InverseTransformDirection(d)); }

    InverseTransformPoint(point) {
        //Todo rekurencyjnie
        const position = this.position;
        const rotation = this.rotation;
        const scale = this.scale;

        const newPoint = Vector3.Sub(point, position);
        Quaternion.MultiplyVector3(rotation.Inverse(), newPoint, newPoint);
        return newPoint.Unscale(scale);
    }
    InverseTransformPoints(points) { return points.map(p => this.InverseTransformPoint(p)); }

    TransformDirection(direction) {
        const rotation = this.rotation;
        const scale = this.scale;

        const newDirection = Vector3.Scale(direction, scale);
        return Quaternion.MultiplyVector3(rotation, newDirection, newDirection);
    }
    TransformDirections(directions) { return directions.map(d => this.TransformDirection(d)); }

    TransformPoint(point) {
        //Todo rekurencyjnie
        const position = this.position;
        const rotation = this.rotation;
        const scale = this.scale;

        const newPoint = Vector3.Scale(point, scale);
        Quaternion.MultiplyVector3(rotation, newPoint, newPoint);
        newPoint.Add(position);

        return this.parent ? this.parent.TransformPoint(newPoint) : newPoint;
    }
    TransformPoints(points) { return points.map(p => this.TransformPoint(p)); }

    TransformVector(vector) {
        const rotation = this.rotation;
        const scale = this.scale;

        const newVector = Vector3.Scale(vector, scale);
        return Quaternion.MultiplyVector3(rotation, newVector, newVector);
    }
    TransformVectors(vectors) { return vectors.map(v => this.TransformVector(v)); }

    Translate(vector) {
        const delta = Vector3.Scale(vector, this.parent.scale);
        Quaternion.MultiplyVector3(this.parent.rotation, delta, delta);
        this.parent.position.Add(delta);
        //Todo set new position
    }

}
