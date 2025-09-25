class DirectionalLight extends Component {

    Init() {
        if (DirectionalLight.main == null) DirectionalLight.main = this;

        this.color = Color.white;

        this.viewMatrix = Matrix4x4.Identity();
        this.projectionMatrix = Matrix4x4.Identity();
        this.viewProjectionMatrix = Matrix4x4.Identity();
        this.inverseViewProjectionMatrix = Matrix4x4.Identity();
    }

    Update() {
        Graphics.lightDirection = this.transform.forward;
        Graphics.lightColor = this.color;

        Matrix4x4.Inverse(this.transform.matrix4x4, this.viewMatrix);
        Matrix4x4.Ortho(-16, 16, -16, 16, 0.1, 100, this.projectionMatrix);
        Matrix4x4.Multiply(this.viewMatrix, this.projectionMatrix, this.viewProjectionMatrix);
        Matrix4x4.Inverse(this.viewProjectionMatrix, this.inverseViewProjectionMatrix);
    }

}