class DirectionalLight extends Behaviour {

    constructor() {
        super();
        const object = this;

        new Property(object, 'color', Color32.white);
        new Property(object, 'shadowColor', new Color(0.5, 0.5, 0.5, 1));

        new Property(object, 'shadowRadius', 0);
        new Property(object, 'shadowBias', 0.003);

        new Property(object, 'aspect', 1);
        new Property(object, 'nearClipPlane', 0.1);
        new Property(object, 'farClipPlane', 100);
        new Property(object, 'fieldOfView', 5);

        new Property(object, 'orthographic', false);
        new Property(object, 'orthographicSize', 50);

        new Property(object, 'viewMatrix', Matrix4x4.Identity());
        new Property(object, 'projectionMatrix', Matrix4x4.Identity());
        new Property(object, 'viewProjectionMatrix', Matrix4x4.Identity());
        new Property(object, 'inverseViewMatrix', Matrix4x4.Identity());
        new Property(object, 'inverseViewProjectionMatrix', Matrix4x4.Identity());

        new Property(object, 'lightBuffer', new Buffer(16 + 16 + 16 + 16 + 16 + 4 + 4 + 4)); //view, projection, viewProjection, inverseView, inverseViewProjection, color, shadowColor, shadowRadius, shadowBias
        new Property(object, 'lightBindGroup', GPU.CreateBindGroup({
            label: 'ViewBindGroup',
            layout: Graphics.lightBindGroupLayout,
            entries: [
                this.lightBuffer.GetBindGroupEntry(0),
            ],
        }));
    }

    Update() {
        this.aspect = 1;

        let matrix = Matrix4x4.TRS(Vector3.Add(Camera.main.transform.position, this.transform.back.Multiply((this.farClipPlane - this.nearClipPlane) * 0.5)), this.transform.rotation, Vector3.one);

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
            88: [this.shadowBias, this.shadowRadius],
        });

        return this.renderables = this.scene.renderables;

        const planes = GeometryUtility.CalculateFrustumPlanes(this);
        this.renderables = this.scene.renderables.filter(c => GeometryUtility.TestPlanesAABB(planes, c.bounds));
    }

}