class DirectionalLight extends Behaviour {

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
        this.inverseViewMatrix = Matrix4x4.Identity();
        this.inverseViewProjectionMatrix = Matrix4x4.Identity();

        this.lightBuffer = new UniformBuffer(16 + 16 + 16 + 16 + 16 + 4 + 4); //view, projection, viewProjection, inverseView, inverseViewProjection, color, shadowColor
        this.lightBindGroup = GPU.CreateBindGroup({
            label: 'ViewBindGroup',
            layout: Graphics.lightBindGroupLayout,
            entries: [
                this.lightBuffer.GetBindGroupEntry(0),
            ],
        });
    }

    OnPreCull() { // co renderować
        const object = this;
        return this.renderables = object.scene.renderables;
        const planes = GeometryUtility.CalculateFrustumPlanes(this);
        this.renderables = object.scene.renderables.filter(function (component) {
            return GeometryUtility.TestPlanesAABB(planes, component.bounds);
        });
    }
    OnPreRender() { // jak renderować
        this.aspect = 1;

        let matrix = Matrix4x4.TRS(Vector3.Add(Camera.main.transform.position, Vector3.Multiply(this.transform.back, (this.farClipPlane - this.nearClipPlane) * 0.5)), this.transform.rotation, this.transform.lossyScale);

        Matrix4x4.Inverse(matrix, this.viewMatrix);
        Matrix4x4.Inverse(this.viewMatrix, this.inverseViewMatrix);
        Matrix4x4.OrthoLH(-this.orthographicSize / 2, this.orthographicSize / 2, -this.orthographicSize / 2, this.orthographicSize / 2, this.nearClipPlane, this.farClipPlane, this.projectionMatrix);
        Matrix4x4.Multiply(this.projectionMatrix, this.viewMatrix, this.viewProjectionMatrix);
        Matrix4x4.Inverse(this.viewProjectionMatrix, this.inverseViewProjectionMatrix);

        this.lightBuffer.Set({
            0: this.viewMatrix,
            16: this.projectionMatrix,
            32: this.viewProjectionMatrix,
            48: this.inverseViewMatrix,
            64: this.inverseViewProjectionMatrix,
            80: this.color,
            84: this.shadowColor,
        });
    }
    OnPostRender() { // rysuj po renderze
        //Rysowanie na GL
    }
    OnRenderImage(src, dst) { // post-processing
        //Wyświetla obraz na ekranie
    }

}