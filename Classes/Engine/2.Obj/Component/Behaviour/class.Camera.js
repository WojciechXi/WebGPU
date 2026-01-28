class Camera extends Behaviour {

    Init() {
        if (Camera.main == null) Camera.main = this;

        this.drawGizmos = true;
        this.parentCamera = Camera.main != this ? Camera.main : null;

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

        this.cameraBuffer = new Buffer(16 + 16 + 16 + 16 + 16); //view, projection, viewProjection, inverseView, inverseViewProjection
        this.cameraBindGroup = GPU.CreateBindGroup({
            label: 'ViewBindGroup',
            layout: Graphics.viewBindGroupLayout,
            entries: [
                this.cameraBuffer.GetBindGroupEntry(0),
            ],
        });
    }

    Update() {
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

        if (this.parentCamera) {
            this.renderables = this.parentCamera.renderables;
            this.SendMessage('OnPreCull')
        } else {
            const planes = GeometryUtility.CalculateFrustumPlanes(this);
            this.renderables = this.scene.renderables.filter(c => c.isVisible && GeometryUtility.TestPlanesAABB(planes, c.bounds));
            this.SendMessage('OnPreCull')
        }
    }

    ScreenPointToRay(position) {
        const origin = this.transform.position;
        const ivp = this.inverseViewProjectionMatrix;
        const ndc = new Vector2(
            position.x * 2 - 1,
            -(position.y * 2 - 1)
        );

        const clip = [ndc.x, ndc.y, -1, 1];

        const w = clip[0] * ivp[3] + clip[1] * ivp[7] + clip[2] * ivp[11] + clip[3] * ivp[15];

        const nearPoint = new Vector3(
            (clip[0] * ivp[0] + clip[1] * ivp[4] + clip[2] * ivp[8] + clip[3] * ivp[12]) / w,
            (clip[0] * ivp[1] + clip[1] * ivp[5] + clip[2] * ivp[9] + clip[3] * ivp[13]) / w,
            (clip[0] * ivp[2] + clip[1] * ivp[6] + clip[2] * ivp[10] + clip[3] * ivp[14]) / w
        );

        const direction = Vector3.Subtract(nearPoint, origin).Normalize();

        return new Ray(origin, direction);
    }

    ScreenToViewportPoint(position) {

    }

    ScreenToWorldPoint(position) {

    }

    OnDrawGizmos(renderPass, camera) {
        if (camera == this) return;
        const cameraMesh = Resources.Get('/Resources/Primitives/Camera.gltf');
        renderPass.DrawMesh(cameraMesh.meshes[0], 0, this.transform.matrix4x4);
    }

}