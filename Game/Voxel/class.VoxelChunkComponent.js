class VoxelChunkComponent extends MonoBehaviour {

    constructor(data = {}, parameters = {}) {
        super(data, {
            ...parameters,
            voxelChunk: { value: new VoxelChunk(), },
            meshRenderer: { value: null, },
            mesh: { value: new Mesh(), set: false, },
        });

    }

    OnEnable() {
        this.meshRenderer = this.GetComponent(MeshRenderer);
        this.meshRenderer.mesh = this.mesh;
    }

    FixedUpdate() {

    }

}