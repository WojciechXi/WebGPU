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

    static FromVector3(vector3) {
        return new Vector3(vector3.x, vector3.y, vector3.z);
    }

    static SqrMagnitude(v) {
        return v[0] * v[0] + v[1] * v[1] + v[2] * v[2];
    }

    static Magnitude(v) {
        return Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]);
    }

    static Add(a, b, dst = null) {
        dst = dst || new Vector3();

        dst[0] = a[0] + b[0];
        dst[1] = a[1] + b[1];
        dst[2] = a[2] + b[2];

        return dst;
    }

    static Subtract(a, b, dst = null) {
        dst = dst || new Vector3();

        dst[0] = a[0] - b[0];
        dst[1] = a[1] - b[1];
        dst[2] = a[2] - b[2];

        return dst;
    }
    static Sub(a, b, dst = null) { return this.Subtract(a, b, dst); }

    static Multiply(a, b, dst = null) {
        dst = dst || new Vector3();

        dst[0] = a[0] * b;
        dst[1] = a[1] * b;
        dst[2] = a[2] * b;

        return dst;
    }
    static Mul(a, b, dst = null) { return this.Multiply(a, b, dst); }

    static Divide(a, b, dst = null) {
        dst = dst || new Vector3();

        dst[0] = a[0] / b;
        dst[1] = a[1] / b;
        dst[2] = a[2] / b;

        return dst;
    }
    static Div(a, b, dst = null) { return this.Divide(a, b, dst); }

    static Scale(a, b, dst = null) {
        dst = dst || new Vector3();

        a[0] *= b[0];
        a[1] *= b[1];
        a[2] *= b[2];

        return dst;
    }

    static Normalize(v, dst = null) {
        dst = dst || new Vector3();

        const magnitude = v.magnitude;
        // make sure we don't divide by 0.
        if (magnitude > 0.00001) {
            dst[0] = v[0] / magnitude;
            dst[1] = v[1] / magnitude;
            dst[2] = v[2] / magnitude;
        } else {
            dst[0] = 0;
            dst[1] = 0;
            dst[2] = 0;
        }

        return dst;
    }

    constructor(x = 0, y = 0, z = 0) {
        super(3);
        this[0] = x;
        this[1] = y;
        this[2] = z;
    }

    get x() { return this[0]; } set x(f) { return this[0] = f; }
    get y() { return this[1]; } set y(f) { return this[1] = f; }
    get z() { return this[2]; } set z(f) { return this[2] = f; }

    get sqrMagnitude() {
        return this[0] * this[0] + this[1] * this[1] + this[2] * this[2];
    }

    get magnitude() {
        return Math.sqrt(this.sqrMagnitude);
    }

    get normalized() {
        const dst = new Vector3();

        const magnitude = this.magnitude;
        if (magnitude > 0.00001) {
            dst[0] = this[0] / magnitude;
            dst[1] = this[1] / magnitude;
            dst[2] = this[2] / magnitude;
        } else {
            dst[0] = 0;
            dst[1] = 0;
            dst[2] = 0;
        }

        return dst;
    }

    SqrMagnitude() {
        return Vector3.SqrMagnitude(this);
    }

    Magnitude() {
        return Vector3.Magnitude(this);
    }

    Normalize() {
        Vector3.Normalize(this, this);
        return this;
    }

    Cross(other, dst = null) {
        dst = dst || new Vector3();

        const t0 = this[1] * other[2] - this[2] * other[1];
        const t1 = this[2] * other[0] - this[0] * other[2];
        const t2 = this[0] * other[1] - this[1] * other[0];

        dst[0] = t0;
        dst[1] = t1;
        dst[2] = t2;

        return dst;
    }

    Dot(other) {
        return this[0] * other[0] + this[1] * other[1] + this[2] * other[2];
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

    Clone() { return new Vector3(this.x, this.y, this.z); }

}