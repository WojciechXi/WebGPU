class Skybox extends Component {

    Init() {
        this.material = null;
    }

    Render() {
        if (!this.material) return;

        // ustaw shader i uniformy
        this.material.Use(Graphics.passEncoder, Camera.main.viewProjectionMatrix, Camera.main.viewProjectionInverseMatrix, this.transform.matrix4x4);
        Graphics.passEncoder.draw(3);
    }

    Destroy() {

    }

}