class Vector4 extends Float32Array {

    static get negativeInfinity() { return new Vector4(-Infinity, -Infinity, -Infinity, -Infinity); }
    static get one() { return new Vector4(1, 1, 1, 1); }
    static get positiveInfinity() { return new Vector4(Infinity, Infinity, Infinity, Infinity); }
    static get zero() { return new Vector4(0, 0, 0, 0); }

    constructor(x = 0, y = 0, z = 0, w = 0) {
        super(4);
        this.x = x;
        this.y = y;
        this.z = z;
        this.w = w;
    }

    get x() { return this[0]; } set x(f) { return this[0] = f; }
    get y() { return this[1]; } set y(f) { return this[1] = f; }
    get z() { return this[2]; } set z(f) { return this[2] = f; }
    get w() { return this[3]; } set w(f) { return this[3] = f; }

    get sqrMagnitude() { return this[0] * this[0] + this[1] * this[1] + this[2] * this[2] + this[3] * this[3]; }
    get magnitude() { return Mathf.Sqrt(this[0] * this[0] + this[1] * this[1] + this[2] * this[2] + this[3] * this[3]); }

    get normalized() {
        const magnitude = this.magnitude;
        if (magnitude > Mathf.Epsilon) return new Vector4(this.x / magnitude, this.y / magnitude, this.z / magnitude, this.w / magnitude);
        return new Vector4(0, 0, 0, 0);
    }

    get normalizedTangent() {
        const magnitude = this.magnitude;
        if (magnitude > 0) return new Vector4(this.x / magnitude, this.y / magnitude, this.z / magnitude, this.w);
        return new Vector4(0, 0, 0, this.w);
    }

}