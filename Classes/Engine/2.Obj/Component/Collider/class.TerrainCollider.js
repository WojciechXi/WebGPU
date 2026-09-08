class TerrainCollider extends Collider {

    constructor() {
        super();

        this.terrain = this.GetComponent(Terrain);
    }

    get bounds() {
        return this.terrain.bounds;
    }

}