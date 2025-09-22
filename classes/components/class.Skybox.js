class Skybox extends Component {

    Init() {
        this.material = null;
    }

    Render(renderPass) {
        if (!this.material) return;

        // ustaw shader i uniformy
        this.material.Use(renderPass, Camera.main.viewProjectionMatrix, Camera.main.viewProjectionInverseMatrix, this.transform.matrix4x4);
        renderPass.draw(3);
    }

    Destroy() {

    }

}