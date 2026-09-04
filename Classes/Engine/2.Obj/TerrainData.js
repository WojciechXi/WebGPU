class TerrainData extends Obj {

    constructor() {
        super();
        const object = this;

        new Property(object, 'alphamapTexture', new RenderTexture());
        new Property(object, 'heightmapTexture', new RenderTexture());
        new Property(object, 'holesTexture', new RenderTexture());
    }

    get alphamapResolution() { return this.alphamapTexture.width; }
    set alphamapResolution(value) {
        this.alphamapResoltion = value;
        this.alphamapTexture = new RenderTexture(this.alphamapResoltion, this.alphamapResoltion);

    }

    get heightmapResolution() { return this.heightmapTexture.width; }
    set heightmapResolution(value) {
        this.heightmapResoltion = value;
        this.heightmapTexture = new RenderTexture(this.heightmapResoltion, this.heightmapResoltion);
    }

    get holesResolution() { return this.holesTexture.width; }
    set holesResolution(value) {
        this.holesResoltion = value;
        this.holesTexture = new RenderTexture(this.holesResoltion, this.holesResoltion);

    }

}