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
                    Graphics.DrawMesh(renderPass, this.mesh, this.transform.matrix4x4, this.materials[i], i, DirectionalLight.main.viewMatrix, DirectionalLight.main.projectionMatrix);
                }
            }
        } else {
            for (let i = 0; i < this.materials.length && this.mesh.subMeshes.length; i++) {
                Graphics.DrawMesh(renderPass, this.mesh, this.transform.matrix4x4, this.materials[i], i, Camera.main.viewMatrix, Camera.main.projectionMatrix);
            }
        }
    }

}
