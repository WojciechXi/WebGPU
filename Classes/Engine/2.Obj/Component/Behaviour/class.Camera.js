class Camera extends Behaviour {

    Init() {
        if (Camera.main == null) Camera.main = this;

        this.rect = new Rect(0, 0, 1, 1);

        this.aspect = 1;
        this.nearClipPlane = 0.1;
        this.farClipPlane = 1000;
        this.fieldOfView = 60;

        this.orthographic = false;
        this.orthographicSize = 100;

        this.viewMatrix = Matrix4x4.Identity();
        this.inverseViewMatrix = Matrix4x4.Identity();
        this.projectionMatrix = Matrix4x4.Identity();
        this.viewProjectionMatrix = Matrix4x4.Identity();
        this.inverseViewProjectionMatrix = Matrix4x4.Identity();
    }

    Update() {
        this.aspect = Graphics.Width / Graphics.Height;

        Matrix4x4.Inverse(this.transform.matrix4x4, this.viewMatrix);
        Matrix4x4.Inverse(this.viewMatrix, this.inverseViewMatrix);
        Matrix4x4.PerspectiveLH(Mathf.DegToRad(this.fieldOfView), this.aspect, this.nearClipPlane, this.farClipPlane, this.projectionMatrix);
        Matrix4x4.Multiply(this.projectionMatrix, this.viewMatrix, this.viewProjectionMatrix);
        Matrix4x4.Inverse(this.viewProjectionMatrix, this.inverseViewProjectionMatrix);
    }

    OnPreCull() { }
    OnPreRender() {
        //Set Shader Data
    }
    OnPostRender() {
        //Rysowanie na GL
    }
    OnRenderImage(src, dst) {
        //Wyświetla obraz na ekranie
    }

}