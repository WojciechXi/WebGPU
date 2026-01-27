class Physics {

    static {
        this.simulate = true;
        this.gravity = new Vector3(0, -9.81, 0);
    }

    static Raycast(ray, maxDistance) {
        const hits = [];
        for (let collider of Engine.Instance.scene.colliders) {
            if (collider.Raycast(ray, maxDistance)) {
                hits.push(collider);
            }
        }
        return hits;
    }

}