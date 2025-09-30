class Vector2 extends Float32Array {

    static get down() { return new Vector2(0, -1); }
    static get left() { return new Vector2(-1, 0); }
    static get negativeInfinity() { return new Vector2(-Infinity, -Infinity); }
    static get one() { return new Vector2(1, 1); }
    static get positiveInfinity() { return new Vector2(Infinity, Infinity); }
    static get right() { return new Vector2(1, 0); }
    static get up() { return new Vector2(0, 1); }
    static get zero() { return new Vector2(0, 0); }

    static Distance(a, b) {
        return Vector2.Subtract(a, b).magnitude;
    }

    static Add(a, b, dst = null) {
        dst = dst || new Vector2();

        dst[0] = a[0] + b[0];
        dst[1] = a[1] + b[1];

        return dst;
    }

    static Subtract(a, b, dst = null) {
        dst = dst || new Vector2();

        dst[0] = a[0] - b[0];
        dst[1] = a[1] - b[1];

        return dst;
    }
    static Sub(a, b, dst = null) { return this.Subtract(a, b, dst); }

    static Multiply(a, b, dst = null) {
        dst = dst || new Vector2();

        dst[0] = a[0] * b;
        dst[1] = a[1] * b;

        return dst;
    }
    static Mul(a, b, dst = null) { return this.Multiply(a, b, dst); }

    static Divide(a, b, dst = null) {
        dst = dst || new Vector2();

        dst[0] = a[0] / b;
        dst[1] = a[1] / b;

        return dst;
    }
    static Div(a, b, dst = null) { return this.Divide(a, b, dst); }

    static Scale(a, b, dst = null) {
        dst = dst || new Vector2();

        a[0] *= b[0];
        a[1] *= b[1];

        return dst;
    }

    constructor(x = 0, y = 0) {
        super(2);
        this[0] = x;
        this[1] = y;
    }

    get x() { return this[0]; } set x(f) { return this[0] = f; }
    get y() { return this[1]; } set y(f) { return this[1] = f; }

    get sqrMagnitude() {
        return this[0] * this[0] + this[1] * this[1];
    }

    get magnitude() {
        return Math.sqrt(this.sqrMagnitude);
    }

    get normalized() {
        const dst = new Vector2();

        const magnitude = v.magnitude;
        if (magnitude > 0.00001) {
            dst[0] = this[0] / magnitude;
            dst[1] = this[1] / magnitude;
        } else {
            dst[0] = 0;
            dst[1] = 0;
        }

        return dst;
    }

    Add(v) {
        Vector2.Add(this, v, this);
        return this;
    }

    Multiply(f) {
        this[0] *= f;
        this[1] *= f;
        return this;
    }

    SetXY(x, y) {
        this[0] = x;
        this[1] = y;
    }

    Set(value) {
        if (Number.isFinite(value)) this[0] = this[1] = this[2] = value;
        else if (value instanceof Vector2) {
            this[0] = value[0];
            this[1] = value[1];
        } else if (value instanceof Vector3 || value instanceof Vector4 || value instanceof Color) {
            this[0] = value[0];
            this[1] = value[1];
        }
    }

}