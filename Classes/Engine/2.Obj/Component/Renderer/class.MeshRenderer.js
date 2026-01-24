class MeshRenderer extends Renderer {

    Init() {
        this.receiveShadows = true;
        this.castShadows = true;

        this.materials = [null];
        this.mesh = null;
    }

    get material() { return this.materials[0]; }
    set material(material) { this.materials = [material]; }

    Draw(renderPass, camera) {
        if (!this.mesh || !this.material) return;

        if (renderPass.name === 'shadowRenderPass') {
            if (!this.castShadows) return;
            for (let i = 0; i < this.materials.length && this.mesh.subMeshes.length; i++) {
                // this.materials[i].Use(renderPass, camera);
                renderPass.SetBindGroup(1, this.transform.transformBindGroup);
                renderPass.DrawMesh(this.mesh, i);
            }
        } else if (renderPass.name == 'gBufferRenderPass') {
            for (let i = 0; i < this.materials.length && this.mesh.subMeshes.length; i++) {
                this.materials[i].Use(renderPass, camera);
                renderPass.SetBindGroup(1, this.transform.transformBindGroup);
                renderPass.DrawMesh(this.mesh, i);
            }
        }
    }

}
