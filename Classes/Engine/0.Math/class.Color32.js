class Color32 extends Float32Array {

    /* Unity */

    // Static Properties
    static get zero() { return new Color(0, 0, 0, 0); }

    static get white() { return new Color(1, 1, 1, 1); }
    static get black() { return new Color(0, 0, 0, 1); }

    static get red() { return new Color(1, 0, 0, 1); }
    static get green() { return new Color(0, 1, 0, 1); }
    static get blue() { return new Color(0, 0, 1, 1); }

    static get Random() { return new Color(Mathf.Random(), Mathf.Random(), Mathf.Random(), 1); }

    // Properties
    get r() { return this[0]; } set r(f) { return this[0] = f; }
    get g() { return this[1]; } set g(f) { return this[1] = f; }
    get b() { return this[2]; } set b(f) { return this[2] = f; }
    get a() { return this[3]; } set a(f) { return this[3] = f; }
    get gamma() { }
    get grayscale() { }
    get linear() { }
    get maxColorComponent() { }

    // Constructors
    constructor(r = 1, g = 1, b = 1, a = 1) {
        super(4);

        this[0] = r;
        this[1] = g;
        this[2] = b;
        this[3] = a;
    }

    // Public Methods
    Set(r, g, b, a) {
        this[0] = r;
        this[1] = g;
        this[2] = b;
        this[3] = a;
    }

    Clear() {
        this[0] = 0;
        this[1] = 0;
        this[2] = 0;
        this[3] = 0;
    }

    // Static Methods
    static HSVToRGB() { }
    static Lerp() { }
    static LerpUnclamped() { }
    static RGBToHSV() { }

    toJSON() {
        return {
            type: 'Color32',
            0: this[0], 1: this[1], 2: this[2], 3: this[3],
        };
    }

}