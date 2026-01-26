class Transform extends Component {

    Init() {
        this.localPosition = Vector3.zero.Clone();
        this.localRotation = Quaternion.identity.Clone();
        this.localScale = Vector3.one.Clone();

        this.parent = null;
        this.children = [];

        this.transformBuffer = new Buffer(16, {
            usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST
        });
    }

    Update() {
        this.transformBuffer.Set({ 0: this.matrix4x4 });
    }

    get childCount() { return this.children.length; }

    // ---------- Hierarchia ----------

    SetParent(newParent) {
        if (this.parent) {
            const i = this.parent.children.indexOf(this);
            if (i !== -1) this.parent.children.splice(i, 1);
        }
        this.parent = newParent;
        if (newParent) newParent.children.push(this);
    }

    ClearParent() { this.SetParent(null); }

    // ---------- Local ----------

    get localEulerAngles() { return Quaternion.ToEuler(this.localRotation); }
    set localEulerAngles(e) { this.localRotation = Quaternion.FromEuler(e); }

    // ---------- World (GET ONLY) ----------

    get position() {
        if (!this.parent) return this.localPosition.Clone();

        const p = Vector3.Scale(this.localPosition, this.parent.scale);
        Quaternion.MultiplyVector3(this.parent.rotation, p, p);
        return p.Add(this.parent.position);
    }

    set position(worldPos) {
        this.localPosition = this.parent
            ? this.parent.InverseTransformPoint(worldPos)
            : worldPos.Clone();
    }

    get rotation() {
        return this.parent
            ? Quaternion.Multiply(this.parent.rotation, this.localRotation)
            : this.localRotation.Clone();
    }

    set rotation(worldRot) {
        this.localRotation = this.parent
            ? Quaternion.Multiply(this.parent.rotation.Inverse(), worldRot)
            : worldRot.Clone();
    }

    get scale() {
        return this.parent
            ? this.parent.scale.Scale(this.localScale)
            : this.localScale.Clone();
    }

    // ---------- Macierz ----------

    get matrix4x4() {
        const local = Matrix4x4.TRS(
            this.localPosition,
            this.localRotation,
            this.localScale
        );
        return this.parent
            ? Matrix4x4.Multiply(this.parent.matrix4x4, local)
            : local;
    }

    // ---------- Osie ----------

    get forward() {
        return Quaternion.MultiplyVector3(this.rotation, Vector3.forward).Normalize();
    }
    get right() {
        return Quaternion.MultiplyVector3(this.rotation, Vector3.right).Normalize();
    }
    get up() {
        return Quaternion.MultiplyVector3(this.rotation, Vector3.up).Normalize();
    }

    get back() { return Vector3.Multiply(this.forward, -1); }
    get left() { return Vector3.Multiply(this.right, -1); }
    get down() { return Vector3.Multiply(this.up, -1); }

    // ---------- Transformacje ----------

    TransformPoint(localPoint) {
        let p = localPoint.Clone();
        let t = this;

        while (t) {
            p = Vector3.Scale(p, t.localScale);
            Quaternion.MultiplyVector3(t.localRotation, p, p);
            p = p.Add(t.localPosition);
            t = t.parent;
        }
        return p;
    }
    TransformPoints(points) { return points.map(p => this.TransformPoint(p)); }

    InverseTransformPoint(worldPoint) {
        let p = worldPoint.Clone();
        const stack = [];

        for (let t = this; t; t = t.parent)
            stack.push(t);

        for (let i = stack.length - 1; i >= 0; --i) {
            const t = stack[i];
            p = Vector3.Sub(p, t.localPosition);
            Quaternion.MultiplyVector3(t.localRotation.Inverse(), p, p);
            p = p.Unscale(t.localScale);
        }
        return p;
    }
    InverseTransformPoints(points) { return points.map(p => this.InverseTransformPoint(p)); }

    TransformDirection(localDir) {
        return Quaternion
            .MultiplyVector3(this.rotation, localDir)
            .Normalize();
    }
    TransformDirections(directions) { return directions.map(d => this.TransformDirection(d)); }

    InverseTransformDirection(worldDir) {
        return Quaternion
            .MultiplyVector3(this.rotation.Inverse(), worldDir)
            .Normalize();
    }
    InverseTransformDirections(directions) { return directions.map(d => this.InverseTransformDirection(d)); }

    TransformVector(localVector) {
        const v = Vector3.Scale(localVector, this.scale);
        return Quaternion.MultiplyVector3(this.rotation, v, v);
    }

    // ---------- Operacje ----------

    Translate(localDelta) {
        this.localPosition.Add(localDelta);
    }
}
