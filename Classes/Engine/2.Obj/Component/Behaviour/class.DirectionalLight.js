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

        this.lightValues = new Float32Array(16 + 16 + 16 + 16 + 16 + 4 + 4); //view, projection, viewProjection, inverseView, inverseViewProjection, color, shadowColor
        this.lightBuffer = GPU.CreateBuffer({
            label: 'uniform buffer',
            size: this.lightValues.length * 4,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        });
        this.lightBindGroup = GPU.CreateBindGroup({
            label: 'ViewBindGroup',
            layout: Graphics.viewBindGroupLayout,
            entries: [
                { binding: 0, resource: { buffer: this.lightBuffer } },
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

        this.lightValues.set(this.viewMatrix, 0);
        this.lightValues.set(this.projectionMatrix, 16);
        this.lightValues.set(this.viewProjectionMatrix, 32);
        this.lightValues.set(this.inverseViewMatrix, 48);
        this.lightValues.set(this.inverseViewProjectionMatrix, 64);
        this.lightValues.set(this.color, 80);
        this.lightValues.set(this.shadowColor, 84);

        GPU.Queue.writeBuffer(this.lightBuffer, 0, this.lightValues);
    }
    OnPostRender() { // rysuj po renderze
        //Rysowanie na GL
    }
    OnRenderImage(src, dst) { // post-processing
        //Wyświetla obraz na ekranie
    }

}