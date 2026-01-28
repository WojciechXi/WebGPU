class TerrainCollider extends Collider {

    Init() {
        super.Init();
        this.terrain = this.GetComponent(Terrain);
    }

    get bounds() {
        return this.terrain.bounds;
    }

}