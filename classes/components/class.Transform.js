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

    static InverseTransformPoint(parent, worldPos) {
        const pScale = parent.lossyScale;
        return new Vector3(
            (worldPos.x - parent.position.x) / pScale.x,
            (worldPos.y - parent.position.y) / pScale.y,
            (worldPos.z - parent.position.z) / pScale.z
        );
    }

    Init() {
        this.localPosition = Vector3.zero;
        this.localRotation = Quaternion.identity;
        this.localScale = Vector3.one;

        this.parent = null;
        this.children = [];
    }

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
    get position() {
        if (!this.parent) return this.localPosition.Clone();
        // uproszczone mnożenie przez rodzica
        return Transform.TransformPoint(this.parent, this.localPosition);
    }
    set position(worldPos) {
        if (!this.parent) this.localPosition = worldPos.Clone();
        else this.localPosition = Transform.InverseTransformPoint(this.parent, worldPos);
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
        const m = Matrix4x4.FromTRS(this.localPosition, this.localRotation, this.localScale);

        // 2. jeśli jest rodzic, pomnóż przez jego macierz
        if (this.parent) {
            return Matrix4x4.Multiply(this.parent.matrix4x4, m);
        } else {
            return m;
        }
    }

    get forward() {
        const m = this.matrix4x4;
        // Unity forward = -Z
        const v = new Vector3(-m[8], -m[9], -m[10]);
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
