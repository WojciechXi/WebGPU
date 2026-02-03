class Physics {

    static {
        this.simulate = false;
        this._gravity = new Vector3(0, -9.81, 0);
    }

    static get gravity() {
        return this._gravity.Clone();
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