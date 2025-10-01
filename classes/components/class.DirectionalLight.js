class DirectionalLight extends Component {

    Init() {
        if (DirectionalLight.main == null) DirectionalLight.main = this;

        this.color = Color.white;
        this.shadowColor = new Color(0.5, 0.5, 0.5, 1);

        this.aspect = 1;
        this.nearClipPlane = 0.1;
        this.farClipPlane = 100;
        this.fieldOfView = 5;

        this.orthographic = false;
        this.orthographicSize = 50;

        this.viewMatrix = Matrix4x4.Identity();
        this.projectionMatrix = Matrix4x4.Identity();
        this.viewProjectionMatrix = Matrix4x4.Identity();
        this.inverseViewProjectionMatrix = Matrix4x4.Identity();
    }

    Update() {
        let matrix = Matrix4x4.TRS(Vector3.Add(Camera.main.transform.position, Vector3.Multiply(this.transform.back, (this.farClipPlane - this.nearClipPlane) * 0.5)), this.transform.rotation, this.transform.lossyScale);

        Matrix4x4.Inverse(matrix, this.viewMatrix);
        Matrix4x4.Ortho(-this.orthographicSize / 2, this.orthographicSize / 2, -this.orthographicSize / 2, this.orthographicSize / 2, this.nearClipPlane, this.farClipPlane, this.projectionMatrix);
        Matrix4x4.Multiply(this.projectionMatrix, this.viewMatrix, this.viewProjectionMatrix);
        Matrix4x4.Inverse(this.viewProjectionMatrix, this.inverseViewProjectionMatrix);
    }

}