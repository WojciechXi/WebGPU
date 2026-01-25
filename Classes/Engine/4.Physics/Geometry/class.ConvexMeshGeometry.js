class ConvexMeshGeometry {

    constructor(scale, scaleAxisRotation) {
        this.scale = scale;
        this.scaleAxisRotation = scaleAxisRotation;
    }

    get Scale() { return this.scale; }
    get ScaleAxisRotation() { return this.scaleAxisRotation; }

}