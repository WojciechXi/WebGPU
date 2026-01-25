class MeshRenderer extends Renderer {

    Init() {
        this.receiveShadows = true;
        this.castShadows = true;

        this.materials = [null];
        this.mesh = null;
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

    OnDrawGizmos(renderPass, camera) {
        const cube = Resources.Get('/Resources/Primitives/Cube.gltf');
        renderPass.DrawMesh(cube.meshes[0], 0, this.transform.matrix4x4);
    }

}
