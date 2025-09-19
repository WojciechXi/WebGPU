class Vector4 extends Float32Array {

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

}