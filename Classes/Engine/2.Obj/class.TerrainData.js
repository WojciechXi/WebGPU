class TerrainData extends Obj {

    Init() {
        this._alphamapTexture = new RenderTexture();
        this._heightmapTexture = new RenderTexture();
        this._holesTexture = new RenderTexture();
    }

    get alphamapResolution() { return this._alphamapTexture.width; }
    set alphamapResolution(value) {
        this._alphamapResoltion = value;
        this._alphamapTexture = new RenderTexture(this._alphamapResoltion, this._alphamapResoltion);

    }

    get _heightmapResolution() { return this._heightmapTexture.width; }
    set _heightmapResolution(value) {
        this.__heightmapResoltion = value;
        this._heightmapTexture = new RenderTexture(this.__heightmapResoltion, this.__heightmapResoltion);

    }

    get _holesResolution() { return this._holesTexture.width; }
    set _holesResolution(value) {
        this.__holesResoltion = value;
        this._holesTexture = new RenderTexture(this.__holesResoltion, this.__holesResoltion);

    }

}