class Color extends Float32Array {

    static get zero() { return new Color(0, 0, 0, 0); }

    static get white() { return new Color(1, 1, 1, 1); }
    static get black() { return new Color(0, 0, 0, 1); }

    static get red() { return new Color(1, 0, 0, 1); }
    static get green() { return new Color(0, 1, 0, 1); }
    static get blue() { return new Color(0, 0, 1, 1); }

    constructor(r = 1, g = 1, b = 1, a = 1) {
        super(4);
        this.r = r;
        this.g = g;
        this.b = b;
        this.a = a;
    }

    get r() { return this[0]; } set r(f) { return this[0] = f; }
    get g() { return this[1]; } set g(f) { return this[1] = f; }
    get b() { return this[2]; } set b(f) { return this[2] = f; }
    get a() { return this[3]; } set a(f) { return this[3] = f; }

}