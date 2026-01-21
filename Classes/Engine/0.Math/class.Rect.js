class Rect extends Float32Array {

    /* Custom */

    /* Unity */

    // Static Properties
    static get zero() { return new Rect(0, 0, 0, 0); }

    // Properties
    get center() { }
    get height() { return this[3]; } set height(f) { return this[3] = f; }
    get max() { }
    get min() { }
    get position() { return new Vector2(this[0], this[1]); }
    get size() { return new Vector2(this[2], this[3]); }
    get width() { return this[2]; } set width(f) { return this[2] = f; }
    get x() { return this[0]; } set x(f) { return this[0] = f; }
    get xMax() { return Mathf.Max(this[0], this[2]); }
    get xMin() { return Mathf.Min(this[0], this[2]); }
    get y() { return this[1]; } set y(f) { return this[1] = f; }
    get yMax() { return Mathf.Max(this[1], this[3]); }
    get yMin() { return Mathf.Min(this[1], this[3]); }

    // Constructors
    constructor(x = 0, y = 0, width = 1, height = 1) {
        super(4);
        this[0] = x;
        this[1] = y;
        this[2] = width;
        this[3] = height;
    }

    // Public Methods
    Contains() { }
    Overlaps() { }
    Set() { }
    ToString() { return JSON.stringify(this); }

    // Static Methods
    static MinMaxRect() { }
    static NormalizedToPoint() { }
    static PointToNormalized() { }

}