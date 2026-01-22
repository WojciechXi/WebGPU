class FrustumPlanes extends Array {

    // Properties
    get left() { return this[0]; } set left(value) { return this[0] = value; }
    get right() { return this[1]; } set right(value) { return this[1] = value; }
    get bottom() { return this[2]; } set bottom(value) { return this[2] = value; }
    get top() { return this[3]; } set top(value) { return this[3] = value; }
    get zNear() { return this[4]; } set zNear(value) { return this[4] = value; }
    get zFar() { return this[5]; } set zFar(value) { return this[5] = value; }

    // Constructors
    constructor(left, right, bottom, top, zNear, zFar) {
        super(6);
        this.left = left;
        this.right = right;
        this.bottom = bottom;
        this.top = top;
        this.zNear = zNear;
        this.zFar = zFar;
    }

}