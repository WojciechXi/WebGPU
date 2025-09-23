class Skybox extends Component {

    Init() {
        this.material = null;
    }

    Render(renderPass, pipeline) {
        if (!this.material) return;

        // ustaw shader i uniformy
        this.material.Use(renderPass, pipeline, this.transform.matrix4x4, Camera.main.viewMatrix, Camera.main.projectionMatrix, Camera.main.viewProjectionMatrix);
        renderPass.draw(6);
    }

    Destroy() {

    }

}