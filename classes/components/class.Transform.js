class Transform extends Component {

    Init() {
        // local space
        this._localPosition = Vector3.zero;
        this._localRotation = Quaternion.Identity();
        this._localScale = Vector3.one;

        // cache world
        this.matrix4x4 = Matrix4x4.Identity(); // world matrix
        this.localMatrix = Matrix4x4.Identity();

        this.parent = null;
        this.children = [];
    }

    // ---------- GETTERY / SETTERY LOCAL ----------
    get localPosition() { return this._localPosition; }
    set localPosition(v) { this._localPosition = v; this.Update(); }

    get localRotation() { return this._localRotation; }
    set localRotation(q) { this._localRotation = q; this.Update(); }

    get localScale() { return this._localScale; }
    set localScale(v) { this._localScale = v; this.Update(); }

    // ---------- GETTERY / SETTERY WORLD ----------
    get position() {
        return new Vector3(this.matrix4x4[12], this.matrix4x4[13], this.matrix4x4[14]);
    }
    set position(worldPos) {
        if (!this.parent) {
            this._localPosition = worldPos;
        } else {
            const invParent = Matrix4x4.Inverse(this.parent.matrix4x4);
            const localPos = Matrix4x4.MultiplyVector3(invParent, worldPos);
            this._localPosition = localPos;
        }
    }

    get rotation() {
        return Matrix4x4.ToQuaternion(this.matrix4x4);
    }
    set rotation(worldRot) {
        if (!this.parent) {
            this._localRotation = worldRot;
        } else {
            const parentRot = this.parent.rotation;
            const invParentRot = Quaternion.Inverse(parentRot);
            this._localRotation = Quaternion.Multiply(invParentRot, worldRot);
        }
    }

    get scale() {
        const sx = Vector3.length([this.matrix4x4[0], this.matrix4x4[1], this.matrix4x4[2]]);
        const sy = Vector3.length([this.matrix4x4[4], this.matrix4x4[5], this.matrix4x4[6]]);
        const sz = Vector3.length([this.matrix4x4[8], this.matrix4x4[9], this.matrix4x4[10]]);
        return new Vector3(sx, sy, sz);
    }
    set scale(worldScale) {
        if (!this.parent) {
            this._localScale = worldScale;
        } else {
            const parentScale = this.parent.scale;
            this._localScale = new Vector3(
                worldScale.x / parentScale.x,
                worldScale.y / parentScale.y,
                worldScale.z / parentScale.z
            );
        }
    }

    // ---------- HIERARCHIA ----------
    ClearParent() {
        if (this.parent) {
            const index = this.parent.children.indexOf(this);
            if (index !== -1) this.parent.children.splice(index, 1);
            this.parent = null;
        }
    }

    SetParent(newParent) {
        this.ClearParent();
        if (newParent) newParent.children.push(this);
        this.parent = newParent;
    }

    // ---------- UPDATE ----------
    Update() {
        // local matrix
        Matrix4x4.Identity(this.localMatrix);
        Matrix4x4.Translate(this.localMatrix, this._localPosition, this.localMatrix);

        const euler = Quaternion.ToEuler(this._localRotation);
        Matrix4x4.RotateX(this.localMatrix, euler[0], this.localMatrix);
        Matrix4x4.RotateY(this.localMatrix, euler[1], this.localMatrix);
        Matrix4x4.RotateZ(this.localMatrix, euler[2], this.localMatrix);

        Matrix4x4.Scale(this.localMatrix, this._localScale, this.localMatrix);

        // world matrix
        if (this.parent) {
            Matrix4x4.Multiply(this.parent.matrix4x4, this.localMatrix, this.matrix4x4);
        } else {
            this.matrix4x4.set(this.localMatrix);
        }
    }

    // ---------- DIRECTION VECTORS ----------
    get forward() {
        const m = this.matrix4x4;
        return new Vector3(-m[8], -m[9], -m[10]).normalize(); // -Z
    }

    get up() {
        const m = this.matrix4x4;
        return new Vector3(m[4], m[5], m[6]).normalize(); // Y
    }

    get right() {
        const m = this.matrix4x4;
        return new Vector3(m[0], m[1], m[2]).normalize(); // X
    }

    get back() {
        return this.forward.multiplyScalar(-1); // przeciwieństwo forward
    }

    get down() {
        return this.up.multiplyScalar(-1); // przeciwieństwo up
    }

    get left() {
        return this.right.multiplyScalar(-1); // przeciwieństwo right
    }

    transformDirection(localDir) {
        const m = this.matrix4x4;

        return new Vector3(
            localDir.x * m[0] + localDir.y * m[4] + localDir.z * m[8],
            localDir.x * m[1] + localDir.y * m[5] + localDir.z * m[9],
            localDir.x * m[2] + localDir.y * m[6] + localDir.z * m[10]
        ).normalize();
    }

    inverseTransformDirection(worldDir) {
        const m = this.matrix4x4;

        return new Vector3(
            worldDir.x * m[0] + worldDir.y * m[1] + worldDir.z * m[2],
            worldDir.x * m[4] + worldDir.y * m[5] + worldDir.z * m[6],
            worldDir.x * m[8] + worldDir.y * m[9] + worldDir.z * m[10]
        ).normalize();
    }
}
