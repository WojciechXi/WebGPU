class Vector2 extends Float32Array {

    static get zero() { return new Vector2(0, 0); }

    constructor(x = 0, y = 0) {
        this.x = x;
        this.y = y;
    }

    get x() { return this[0]; } set x(f) { return this[0] = f; }
    get y() { return this[1]; } set y(f) { return this[1] = f; }

}