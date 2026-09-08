class Camera extends Behaviour {

    constructor() {
        super();
        const object = this;

        if (Camera.main == null) Camera.main = this;

        new Property(object, 'backgroundColor', Color32.clear);

        new Property(object, 'drawGizmos', Camera.main != this);
        new Property(object, 'parentCamera', Camera.main != this ? Camera.main : null);

        new Property(object, 'renderables', []);
        new Property(object, 'rect', new Rect(0, 0, 1, 1));

        new Property(object, 'aspect', 1);
        new Property(object, 'nearClipPlane', 0.1);
        new Property(object, 'farClipPlane', 1000);
        new Property(object, 'fieldOfView', 90);

        new Property(object, 'orthographic', false);
        new Property(object, 'orthographicSize', 100);

        new Property(object, 'cameraBuffer', new Buffer(16 + 16 + 16 + 16 + 16)); //view, projection, viewProjection, inverseView, inverseViewProjection
        new Property(object, 'cameraBindGroup', GPU.CreateBindGroup({
            label: 'ViewBindGroup',
            layout: Graphics.viewBindGroupLayout,
            entries: [
                this.cameraBuffer.GetBindGroupEntry(0),
            ],
        }));

        object.viewMatrix = Matrix4x4.Identity();
        object.projectionMatrix = Matrix4x4.Identity();
        object.viewProjectionMatrix = Matrix4x4.Identity();
        object.inverseViewMatrix = Matrix4x4.Identity();
        object.inverseViewProjectionMatrix = Matrix4x4.Identity();

        Engine.Instance.scene.cameras.push(this);
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
            this.SendMessage('OnPreCull')
        } else {
            this.SendMessage('OnPreCull')
        }
    }

    ScreenPointToRay(position) {
        const origin = this.transform.position;
        const ivp = this.inverseViewProjectionMatrix;

        const ndc = new Vector2((position.x / Graphics.Width) * 2 - 1, 1 - (position.y / Graphics.Height) * 2);

        const clipX = ndc.x;
        const clipY = ndc.y;
        const clipZ = 0.0;
        const clipW = 1.0;

        const w = clipX * ivp[3] + clipY * ivp[7] + clipZ * ivp[11] + clipW * ivp[15];

        const nearPoint = new Vector3(
            (clipX * ivp[0] + clipY * ivp[4] + clipZ * ivp[8] + clipW * ivp[12]) / w,
            (clipX * ivp[1] + clipY * ivp[5] + clipZ * ivp[9] + clipW * ivp[13]) / w,
            (clipX * ivp[2] + clipY * ivp[6] + clipZ * ivp[10] + clipW * ivp[14]) / w
        );

        const direction = Vector3.Subtract(nearPoint, origin).Normalize();

        return new Ray(origin, direction);
    }

    ScreenToViewportPoint(position) {

    }

    ScreenToWorldPoint(position) {

    }

    TryGetCullingParameters(callback) {

    }

    OnDrawGizmos(renderPass, camera) {
        if (camera == this) return;
        const cameraMesh = Resources.Load('Primitives/Camera.gltf');
        renderPass.DrawMesh(cameraMesh.meshes[0], 0, this.transform.matrix4x4);
    }

}