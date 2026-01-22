class MeshRenderer extends Renderer {

    Init() {
        this.receiveShadows = true;
        this.castShadows = true;

        this.materials = [null];
        this.mesh = null;
    }

    get material() {
        return this.materials[0];
    }

    set material(material) {
        this.materials[0] = material;
    }

    Draw(camera, renderPass) {
        if (!this.mesh || !this.material) return;

        if (renderPass.name === 'shadowRenderPass') {
            if (!this.castShadows) return;

            for (let i = 0; i < this.materials.length && this.mesh.subMeshes.length; i++) {
                Graphics.DrawMesh(renderPass, this.mesh, this.gameObject.transformBindGroup, this.materials[i], i, DirectionalLight.main.viewMatrix, DirectionalLight.main.projectionMatrix);
            }
        } else if (renderPass.name == 'gBufferRenderPass') {
            for (let i = 0; i < this.materials.length && this.mesh.subMeshes.length; i++) {
                Graphics.DrawMesh(renderPass, this.mesh, this.gameObject.transformBindGroup, this.materials[i], i, camera.viewMatrix, camera.projectionMatrix);
            }
        } else if (renderPass.name == 'gizmosRenderPass') {

        }
    }

}
