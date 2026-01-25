class Transform extends Component {

    // ---------- Helper funkcje ----------
    static TransformPoint(parent, localPos) {
        const pScale = parent.lossyScale;
        return new Vector3(
            localPos.x * pScale.x + parent.position.x,
            localPos.y * pScale.y + parent.position.y,
            localPos.z * pScale.z + parent.position.z
        );
    }

    static InverseTransformPoint(parent, position) {
        const pScale = parent.lossyScale;
        return new Vector3(
            (position.x - parent.position.x) / pScale.x,
            (position.y - parent.position.y) / pScale.y,
            (position.z - parent.position.z) / pScale.z
        );
    }

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

    get localEulerAngles() {
        return Quaternion.ToEuler(this.localRotation);
    }
    set localEulerAngles(localEulerAngles) {
        this.localRotation = Quaternion.FromEuler(localEulerAngles);
    }

    get position() {
        if (!this.parent) return this.localPosition.Clone();
        // uproszczone mnożenie przez rodzica
        return Transform.TransformPoint(this.parent, this.localPosition);
    }
    set position(position) {
        if (!this.parent) this.localPosition = position.Clone();
        else this.localPosition = Transform.InverseTransformPoint(this.parent, position);
    }

    get rotation() {
        if (!this.parent) return this.localRotation.Clone();
        return Quaternion.Multiply(this.parent.rotation, this.localRotation);
    }
    set rotation(worldRot) {
        if (!this.parent) this.localRotation = worldRot.Clone();
        else {
            const invParent = Quaternion.Inverse(this.parent.rotation);
            this.localRotation = Quaternion.Multiply(invParent, worldRot);
        }
    }

    get eulerAngles() {
        if (!this.parent) return Quaternion.ToEuler(this.localRotation);
        return Quaternion.Multiply(this.parent.eulerAngles, this.localRotation);
    }
    set eulerAngles(eulerAngles) {
        if (!this.parent) this.localRotation = Quaternion.FromEuler(eulerAngles);
        else {

        }
    }

    get lossyScale() {
        if (!this.parent) return this.localScale.Clone();
        const pScale = this.parent.lossyScale;
        return new Vector3(
            this.localScale.x * pScale.x,
            this.localScale.y * pScale.y,
            this.localScale.z * pScale.z
        );
    }

    get matrix4x4() {
        // 1. macierz lokalna
        const m = Matrix4x4.TRS(this.localPosition, this.localRotation, this.localScale);

        // 2. jeśli jest rodzic, pomnóż przez jego macierz
        if (this.parent) {
            return Matrix4x4.Multiply(this.parent.matrix4x4, m);
        } else {
            return m;
        }
    }

    get forward() {
        const m = this.matrix4x4;
        const v = new Vector3(m[8], m[9], m[10]);
        return v.Normalize();
    }

    get back() { return Vector3.Multiply(this.forward, -1); }

    get right() {
        const m = this.matrix4x4;
        const v = new Vector3(m[0], m[1], m[2]); // X kolumna
        return v.Normalize();
    }

    get left() { return Vector3.Multiply(this.right, -1); }

    get up() {
        const m = this.matrix4x4;
        const v = new Vector3(m[4], m[5], m[6]); // Y kolumna
        return v.Normalize();
    }

    get down() { return Vector3.Multiply(this.up, -1); }

}
