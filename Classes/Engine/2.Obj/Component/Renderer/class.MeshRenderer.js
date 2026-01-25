class MeshRenderer extends Renderer {

    Init() {
        this.receiveShadows = true;
        this.castShadows = true;

        this.materials = [null];
        this.mesh = null;
    }

    get bounds() {
        if (!this.mesh) return super.bounds;
        const bounds = this.mesh.bounds;
        return new Bounds(Vector3.Add(this.transform.position, Vector3.Scale(bounds.center, this.transform.lossyScale)), Vector3.Scale(bounds.size, this.transform.lossyScale));
    }

    get material() { return this.materials[0]; }
    set material(material) { this.materials = [material]; }

    OnDraw(renderPass, camera) {
        if (!this.mesh || !this.material) return;

        if (renderPass.name === 'shadowRenderPass') {
            if (!this.castShadows) return;
            for (let i = 0; i < this.materials.length && this.mesh.subMeshes.length; i++) {
                renderPass.DrawMesh(this.mesh, i, this.transform.transformBuffer.buffer);
            }
        } else if (renderPass.name == 'gBufferRenderPass') {
            for (let i = 0; i < this.materials.length && this.mesh.subMeshes.length; i++) {
                this.materials[i].Use(renderPass, camera);
                renderPass.DrawMesh(this.mesh, i, this.transform.transformBuffer.buffer);
            }
        }
    }

    // OnDrawGizmos(renderPass, camera) {
    //     const cube = Resources.Get('/Resources/Primitives/Cube.gltf');
    //     const bounds = this.bounds;
    //     let matrix = Matrix4x4.TRS(bounds.center, this.transform.rotation, bounds.size);
    //     renderPass.DrawMesh(cube.meshes[0], 0, matrix);
    // }

}
