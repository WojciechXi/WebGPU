class Vector3 extends Float32Array {

    static get zero() { return new Vector3(0, 0, 0); }
    static get one() { return new Vector3(1, 1, 1); }

    static get left() { return new Vector3(-1, 0, 0); }
    static get right() { return new Vector3(1, 0, 0); }
    static get up() { return new Vector3(0, 1, 0); }
    static get down() { return new Vector3(0, -1, 0); }

    static Cross(a, b, dst) {
        dst = dst || new Float32Array(3);

        const t0 = a[1] * b[2] - a[2] * b[1];
        const t1 = a[2] * b[0] - a[0] * b[2];
        const t2 = a[0] * b[1] - a[1] * b[0];

        dst[0] = t0;
        dst[1] = t1;
        dst[2] = t2;

        return dst;
    }

    static Add(a, b, dst) {
        dst = dst || new Float32Array(3);

        dst[0] = a[0] + b[0];
        dst[1] = a[1] + b[1];
        dst[2] = a[2] + b[2];

        return dst;
    }

    static Subtract(a, b, dst) {
        dst = dst || new Float32Array(3);

        dst[0] = a[0] - b[0];
        dst[1] = a[1] - b[1];
        dst[2] = a[2] - b[2];

        return dst;
    }

    static Normalize(v, dst) {
        dst = dst || new Float32Array(3);

        const length = Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]);
        // make sure we don't divide by 0.
        if (length > 0.00001) {
            dst[0] = v[0] / length;
            dst[1] = v[1] / length;
            dst[2] = v[2] / length;
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
    }

}