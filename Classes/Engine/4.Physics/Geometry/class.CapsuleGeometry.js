class CapsuleGeometry {

    constructor(center1, center2, radius, isValid) {
        this.center1 = center1;
        this.center2 = center2;
        this.isValid = isValid;
        this.radius = radius;
    }

    CalculateAABB() {

    }

    CalculateMassConfiguration() {

    }

    CastRay() {

    }

    CastShape() {

    }

    ClosestPoint() {

    }

    Intersect() {

    }

    InverseTransform() {

    }

    OverlapPoint() {

    }

    Transform() {

    }

    static Create(center1, center2, radius) {
        return new CapsuleGeometry(center1, center2, radius, true);
    }

}