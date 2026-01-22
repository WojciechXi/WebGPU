class Camera extends Behaviour {

    Init() {
        if (Camera.main == null) Camera.main = this;

        this.renderables = [];
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

        this.cameraValues = new Float32Array(16 + 16); //view, projection
        this.cameraBuffer = GPU.CreateBuffer({
            label: 'uniform buffer',
            size: this.cameraValues.length * 4,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        });
        this.cameraBindGroup = GPU.CreateBindGroup({
            label: 'ViewBindGroup',
            layout: Graphics.viewBindGroupLayout,
            entries: [
                { binding: 0, resource: { buffer: this.cameraBuffer } },
            ],
        });
    }

    OnPreCull() { // co renderować
        const object = this;
        const planes = GeometryUtility.CalculateFrustumPlanes(this);
        return this.renderables = object.scene.renderables;
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

        this.cameraValues.set(this.viewMatrix, 0);
        this.cameraValues.set(this.projectionMatrix, 16);

        GPU.Queue.writeBuffer(this.cameraBuffer, 0, this.cameraValues);
    }
    OnPostRender() { // rysuj po renderze
        //Rysowanie na GL
    }
    OnRenderImage(src, dst) { // post-processing
        //Wyświetla obraz na ekranie
    }

}