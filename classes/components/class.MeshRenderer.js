class MeshRenderer extends Component {

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

    Render(renderPass) {
        if (!this.mesh || !this.material) return;

        if (renderPass.name === 'shadowRenderPass') {
            if (this.castShadows) {
                for (let i = 0; i < this.materials.length && this.mesh.subMeshes.length; i++) {
                    if (this.material.Use(renderPass, this.transform.matrix4x4, DirectionalLight.main.viewMatrix, DirectionalLight.main.projectionMatrix)) {
                        this.mesh.subMeshes[i].Render(renderPass);
                    }
                }
            }
        } else {
            for (let i = 0; i < this.materials.length && this.mesh.subMeshes.length; i++) {
                if (this.material.Use(renderPass, this.transform.matrix4x4, Camera.main.viewMatrix, Camera.main.projectionMatrix)) {
                    this.mesh.subMeshes[i].Render(renderPass);
                }
            }
        }
    }

}
