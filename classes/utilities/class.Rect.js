class Rect extends Float32Array {

    constructor(x = 0, y = 0, width = 1, height = 1) {
        super(4);
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
    }

    get x() { return this[0]; } set x(f) { return this[0] = f; }
    get y() { return this[1]; } set y(f) { return this[1] = f; }
    get width() { return this[2]; } set width(f) { return this[2] = f; }
    get height() { return this[3]; } set height(f) { return this[3] = f; }

}