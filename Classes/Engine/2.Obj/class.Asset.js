class Asset extends Obj {

    constructor(data = {}, parameters = {}) {
        super(data, {
            ...parameters,
            gameObject: { value: data._gameObject ?? data.gameObject ?? null, },
            animations: { value: data._animations ?? data.animations ?? [], },
            materials: { value: data._materials ?? data.materials ?? [], },
            textures: { value: data._textures ?? data.textures ?? [], },
            meshes: { value: data._meshes ?? data.meshes ?? [], },
            skins: { value: data._skins ?? data.skins ?? [], },
        });
    }

}