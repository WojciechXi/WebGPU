class Test2 extends MonoBehaviour {

    Init() {
        this.turn = new Vector3(0, 0, 0);
    }

    OnEnable() {
        this.meshRenderer = this.GetComponent(MeshRenderer);
    }

    Update() {
        this.turn.y += Time.deltaTime * 15.0;
        this.transform.rotation = Quaternion.FromEuler(this.turn.x, this.turn.y, 0);
    }

    // OnDrawGizmos(renderPass, camera) {
    //     if (!this.meshRenderer || !this.meshRenderer.mesh) return;
    //     this.cube = this.cube ?? Resources.Get('/Resources/Primitives/Cube.gltf');

    //     const bounds = this.meshRenderer.bounds;
    //     const matrix = Matrix4x4.TRS(bounds.center, Quaternion.identity, bounds.size);
    //     renderPass.DrawMesh(this.cube.meshes[0], 0, matrix);
    // }

}