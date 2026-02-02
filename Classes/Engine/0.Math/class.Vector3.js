class Vector3 extends Float32Array {

    static get back() { return new Vector3(0, 0, -1); }
    static get down() { return new Vector3(0, -1, 0); }
    static get forward() { return new Vector3(0, 0, 1); }
    static get left() { return new Vector3(-1, 0, 0); }
    static get negativeInfinity() { return new Vector3(-Infinity, -Infinity, -Infinity); }
    static get one() { return new Vector3(1, 1, 1); }
    static get positiveInfinity() { return new Vector3(Infinity, Infinity, Infinity); }
    static get right() { return new Vector3(1, 0, 0); }
    static get up() { return new Vector3(0, 1, 0); }
    static get zero() { return new Vector3(0, 0, 0); }

    get x() { return this[0]; } set x(value) { return this[0] = value; }
    get y() { return this[1]; } set y(value) { return this[1] = value; }
    get z() { return this[2]; } set z(value) { return this[2] = value; }

    get sqrMagnitude() {
        return this[0] * this[0] + this[1] * this[1] + this[2] * this[2];
    }

    get magnitude() {
        return Mathf.Sqrt(this.sqrMagnitude);
    }

    get normalized() {
        const out = new Vector3();

        const magnitude = this.magnitude;
        if (magnitude > Mathf.Epsilon) {
            out[0] = this[0] / magnitude;
            out[1] = this[1] / magnitude;
            out[2] = this[2] / magnitude;
        } else {
            out[0] = 0;
            out[1] = 0;
            out[2] = 0;
        }

        return out;
    }

    constructor(x = 0, y = 0, z = 0) {
        super(3);
        this[0] = x;
        this[1] = y;
        this[2] = z;
    }

    SqrMagnitude() {
        return Vector3.SqrMagnitude(this);
    }

    Magnitude() {
        return Vector3.Magnitude(this);
    }

    Normalize(out = this) {
        out = out || this.Clone();

        const magnitude = this.magnitude;
        if (magnitude > Mathf.Epsilon) {
            out[0] = this[0] / magnitude;
            out[1] = this[1] / magnitude;
            out[2] = this[2] / magnitude;
        } else {
            out[0] = out[1] = out[2] = 0;
        }

        return out;
    }

    Cross(other, out = null) {
        out = out || new Vector3();
        out[0] = this[1] * other[2] - this[2] * other[1];
        out[1] = this[2] * other[0] - this[0] * other[2];
        out[2] = this[0] * other[1] - this[1] * other[0];
        return out;
    }
    static Cross(a, b, out = null) { return a.Cross(b, out); }

    Dot(other) { return this[0] * other[0] + this[1] * other[1] + this[2] * other[2]; }

    Add(b, out = this) {
        out = out || this.Clone();
        out[0] += b[0];
        out[1] += b[1];
        out[2] += b[2];
        return out;
    }

    Subtract(b, out = this) {
        out = out || this.Clone();
        out[0] -= b[0];
        out[1] -= b[1];
        out[2] -= b[2];
        return out;
    }

    Multiply(b, out = this) {
        out = out || this.Clone();
        out[0] *= b;
        out[1] *= b;
        out[2] *= b;
        return out;
    }

    Divide(b, out = this) {
        out = out || this.Clone();
        out[0] /= b;
        out[1] /= b;
        out[2] /= b;
        return out;
    }

    Unscale(b, out = this) {
        out = out || this.Clone();
        out[0] /= b[0];
        out[1] /= b[1];
        out[2] /= b[2];
        return out;
    }

    Scale(b, out = this) {
        out = out || this.Clone();
        out[0] *= b[0];
        out[1] *= b[1];
        out[2] *= b[2];
        return out;
    }

    Set(value) {
        if (Number.isFinite(value)) this[0] = this[1] = this[2] = value;
        else if (value instanceof Vector2) {
            this[0] = value[0];
            this[1] = value[1];
        } else if (value instanceof Vector3 || value instanceof Vector4 || value instanceof Color) {
            this[0] = value[0];
            this[1] = value[1];
            this[2] = value[2];
        }
        return this;
    }

    Clear() { this[0] = this[1] = this[2] = 0; }
    Clone() { return new Vector3(this.x, this.y, this.z); }
    toString() { return JSON.stringify(this); }

    Equals(other) {
        if (!other || typeof this != typeof other) return false;
        return this[0] == other[0] && this[1] == other[1] && this[2] == other[2];
    }

    Round(out = this) {
        out = out || this.Clone();
        out[0] = Mathf.Round(out[0]);
        out[1] = Mathf.Round(out[1]);
        out[2] = Mathf.Round(out[2]);
        return out;
    }

    Abs(out = this) {
        out = out || this.Clone();
        out[0] = Mathf.Abs(out[0]);
        out[1] = Mathf.Abs(out[1]);
        out[2] = Mathf.Abs(out[2]);
        return out;
    }

    Negate(out = this) {
        out = out || this.Clone();
        out[0] = -out[0];
        out[1] = -out[1];
        out[2] = -out[2];
        return out;
    }

    static Distance(a, b) {
        return Mathf.Sqrt(
            (b.x - a.x) * (b.x - a.x) +
            (b.y - a.y) * (b.y - a.y) +
            (b.z - a.z) * (b.z - a.z)
        );
    }

    static Lerp(a, b, t, out = null) {
        out = out || new Vector3();
        out[0] = Mathf.Lerp(a[0], b[0], t);
        out[1] = Mathf.Lerp(a[1], b[1], t);
        out[2] = Mathf.Lerp(a[2], b[2], t);
        return out;
    }

    static Add(a, b, out = null) { return a.Add(b, out); }
    static Subtract(a, b, out = null) { return a.Subtract(b, out); }
    static Sub(a, b, out = null) { return a.Subtract(b, out); }
    static Multiply(a, b, out = null) { return a.Multiply(b, out); }
    static Mul(a, b, out = null) { return a.Multiply(b, out); }
    static Divide(a, b, out = null) { return a.Divide(b, out); }
    static Div(a, b, out = null) { return a.Divide(b, out); }
    static Unscale(a, b, out = null) { return a.Unscale(b, out); }
    static Scale(a, b, out = null) { return a.Scale(b, out); }
    static Dot(a, b) { return a.Dot(b); }
    static Magnitude(v) {
        return Mathf.Sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]);
    }
    static Normalize(v, out = null) { return v.Normalize(out); }

    static FromVector3(vector3) {
        return new Vector3(vector3.x, vector3.y, vector3.z);
    }

    static SqrMagnitude(v) {
        return v[0] * v[0] + v[1] * v[1] + v[2] * v[2];
    }

    VectorTo(b) { return Vector3.Subtract(this, b); }
    static VectorTo(a, b) { return a.VectorTo(b); }

    DirectionTo(b) { return Vector3.Subtract(this, b).Normalize(); }
    static DirectionTo(a, b) { return a.DirectionTo(b); }

}