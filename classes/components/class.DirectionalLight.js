class DirectionalLight extends Component {

    Init() {
        this.color = Color.white;
    }

    Update() {
        Matrix4x4.Ortho(-128, 128, -128, 128, 0.1, 1000, Graphics.lightViewProjectionMatrix);
        Matrix4x4.Multiply(Graphics.lightViewProjectionMatrix, this.transform.matrix4x4);

        Graphics.lightDirection = this.transform.down;
        Graphics.lightColor = this.color;
    }

}