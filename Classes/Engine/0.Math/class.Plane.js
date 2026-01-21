class Plane {

    static FromInNormalD(inNormal, d) { }
    static FromABC(a, b, c) { return new this(a, b, c); }

    // Properties
    get distance() { }
    get flipped() { }
    get normal() { }

    // Constructors
    constructor(a, b, c) {
        this.a = a;
        this.b = b;
        this.c = c;
    }

    // Public Methods
    ClosestPointOnPlane() { }
    Flip() { }
    GetDistanceToPoint() { }
    GetSide() { }
    Raycast() { }
    SameSide() { }
    Set3Points() { }
    SetNormalAndPosition() { }
    Translate() { }

}