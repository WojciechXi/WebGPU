class Physics {

    static {
        this.simulate = false;
        this.gravity = new Vector3(0, -9.81, 0);
    }

    static Raycast(ray, maxDistance) {
        const raycastHits = [];
        let raycastHit = null;
        for (let collider of Engine.Instance.scene.colliders) {
            if (raycastHit = collider.Raycast(ray, maxDistance)) {
                raycastHits.push(raycastHit);
            }
        }
        return raycastHits;
    }

}