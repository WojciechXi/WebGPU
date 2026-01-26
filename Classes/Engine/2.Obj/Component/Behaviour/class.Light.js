class Light extends Behaviour {

    Init() {
        this.areaSize = Vector2.one;
        this.bakingOutput = null;
        this.bounceIntensity = 1;
        this.boundingSphereOverride = new Vector4();
        this.color = Color32.white;
        this.colorTemperature = 0;
        this.cookieSize2D = Vector2.zero;
        this.cullingMask = 0;
        this.dilatedRange = 100;
        this.enableSpotReflector = true;
        this.flare = null;
        this.forceVisible = true;
        this.innerSpotAngle = 0;
        this.intensity = 1;
        this.layerShadowCullDistances = [];
        // this.lightmapBakeType = [];
        this.lightShadowCasterMode = null;
        this.lightUnit = null;
        this.luxAtDistance = 0;
        this.range = 100;
        this.renderingLayerMask = 0;
        this.renderMode = null;
        // this.shadowAngle = 0;
        this.shadowBias = 0;
        this.shadowCustomResolution = 0;
        this.shadowMatrixOverride = null;
        this.shadowNearPlane = 0;
        this.shadowNormalBias = 0;
        this.shadowRadius = 0;
        this.shadowResolution = null;
        this.shadows = null;
        this.shadowStrength = 1;
        this.spotAngle = 1;
        this.type = null;
        this.useBoundingSphereOverride = false;
        this.useColorTemperature = false;
        this.useShadowMatrixOverride = false;
        this.useViewFrustumForShadowCasterCull = false;

        this.shadowColor = new Color32(0.5, 0.5, 0.5, 1);

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

        this.lightBuffer = new Buffer(16 + 16 + 16 + 16 + 16 + 4 + 4 + 4); //view, projection, viewProjection, inverseView, inverseViewProjection, color, shadowColor, shadowBias, shadowStrength
        this.lightBindGroup = GPU.CreateBindGroup({
            label: 'ViewBindGroup',
            layout: Graphics.viewBindGroupLayout,
            entries: [
                this.lightBuffer.GetBindGroupEntry(0),
            ],
        });
    }

    get commandBufferCount() { return 0; }

    Update() {
        this.aspect = 1;

        let matrix = Matrix4x4.TRS(Vector3.Add(Camera.main.transform.position, Vector3.Multiply(this.transform.back, (this.farClipPlane - this.nearClipPlane) * 0.5)), this.transform.rotation, this.transform.scale);

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
            88: [this.shadowBias, this.shadowNormalBias, this.shadowStrength, this.shadowNearPlane],
        });

        return this.renderables = this.scene.renderables;
        const planes = GeometryUtility.CalculateFrustumPlanes(this);
        this.renderables = this.scene.renderables.filter(c => GeometryUtility.TestPlanesAABB(planes, c.bounds));
    }

}