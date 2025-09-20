class Vector2 extends Float32Array {

    static get zero() { return new Vector2(0, 0); }
    static get one() { return new Vector2(1, 1); }

    static get down() { return new Vector2(0, -1); }

    static Add(a, b, dst) {
        dst = dst || new Vector2();

        dst[0] = a[0] + b[0];
        dst[1] = a[1] + b[1];

        return dst;
    }

    static Subtract(a, b, dst) {
        dst = dst || new Vector2();

        dst[0] = a[0] - b[0];
        dst[1] = a[1] - b[1];

        return dst;
    }

    static Normalize(v, dst) {
        dst = dst || new Vector2();

        const length = Math.sqrt(v[0] * v[0] + v[1] * v[1]);
        // make sure we don't divide by 0.
        if (length > 0.00001) {
            dst[0] = v[0] / length;
            dst[1] = v[1] / length;
        } else {
            dst[0] = 0;
            dst[1] = 0;
        }

        return dst;
    }

    constructor(x = 0, y = 0) {
        super(2);
        this[0] = x;
        this[1] = y;
    }

    get x() { return this[0]; } set x(f) { return this[0] = f; }
    get y() { return this[1]; } set y(f) { return this[1] = f; }

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