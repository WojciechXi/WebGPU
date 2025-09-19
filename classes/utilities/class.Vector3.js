class Vector3 extends Float32Array {

    static get zero() { return new Vector3(0, 0, 0); }
    static get one() { return new Vector3(1, 1, 1); }

    constructor(x = 0, y = 0, z = 0) {
        super(3);
        this.x = x;
        this.y = y;
        this.z = z;
    }

    get x() { return this[0]; } set x(f) { return this[0] = f; }
    get y() { return this[1]; } set y(f) { return this[1] = f; }
    get z() { return this[2]; } set z(f) { return this[2] = f; }

}