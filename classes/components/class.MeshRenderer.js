class MeshRenderer extends Component {

    Init() {
        this.receiveShadows = true;
        this.castShadows = true;

        this.material = null;
        this.mesh = null;
    }

    Render(renderPass) {
        if (!this.mesh || !this.material) return;

        if (renderPass.name === 'shadowRenderPass') {
            if (this.castShadows && this.material.Use(renderPass, this.transform.matrix4x4, DirectionalLight.main.viewMatrix, DirectionalLight.main.projectionMatrix)) {
                this.mesh.Render(renderPass);
            }
        } else if (this.material.Use(renderPass, this.transform.matrix4x4, Camera.main.viewMatrix, Camera.main.projectionMatrix)) {
            this.mesh.Render(renderPass);
        }
    }
}
