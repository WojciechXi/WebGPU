class Camera extends Behaviour {

    Init() {
        if (Camera.main == null) Camera.main = this;

        this.renderables = [];
        this.rect = new Rect(0, 0, 1, 1);

        this.aspect = 1;
        this.nearClipPlane = 0.1;
        this.farClipPlane = 1000;
        this.fieldOfView = 90;

        this.orthographic = false;
        this.orthographicSize = 100;

        this.viewMatrix = Matrix4x4.Identity();
        this.projectionMatrix = Matrix4x4.Identity();
        this.viewProjectionMatrix = Matrix4x4.Identity();
        this.inverseViewMatrix = Matrix4x4.Identity();
        this.inverseViewProjectionMatrix = Matrix4x4.Identity();

        this.cameraBuffer = new UniformBuffer(16 + 16 + 16 + 16 + 16); //view, projection, viewProjection, inverseView, inverseViewProjection
        this.cameraBindGroup = GPU.CreateBindGroup({
            label: 'ViewBindGroup',
            layout: Graphics.viewBindGroupLayout,
            entries: [
                this.cameraBuffer.GetBindGroupEntry(0),
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
        this.aspect = (Graphics.Width * this.rect.width) / (Graphics.Height * this.rect.height);

        Matrix4x4.Inverse(this.transform.matrix4x4, this.viewMatrix);
        Matrix4x4.Inverse(this.viewMatrix, this.inverseViewMatrix);
        Matrix4x4.PerspectiveLH(Mathf.DegToRad(this.fieldOfView), this.aspect, this.nearClipPlane, this.farClipPlane, this.projectionMatrix);
        Matrix4x4.Multiply(this.projectionMatrix, this.viewMatrix, this.viewProjectionMatrix);
        Matrix4x4.Inverse(this.viewProjectionMatrix, this.inverseViewProjectionMatrix);

        this.cameraBuffer.Set({
            0: this.viewMatrix,
            16: this.projectionMatrix,
            32: this.viewProjectionMatrix,
            48: this.inverseViewMatrix,
            64: this.inverseViewProjectionMatrix,
        });
    }
    OnPostRender() { // rysuj po renderze
        //Rysowanie na GL
    }
    OnRenderImage(src, dst) { // post-processing
        //Wyświetla obraz na ekranie
    }

}