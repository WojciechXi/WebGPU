class PlaneCollider extends BoxCollider {

    constructor() {
        super();

        this.center = new Vector3(0, -0.5, 0);
        this.size = new Vector3(1, 1, 1); // rozmiar plane w lokalnej skali
    }

    OnDrawGizmos(renderPass, camera) {
        let bounds = this.bounds;
        renderPass.DrawPlane(bounds.center, bounds.size);
        renderPass.DrawRay(new Ray(this.transform.position, this.transform.up));
    }

}