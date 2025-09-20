class Material {

    constructor(shader) {
        this.shader = shader;
        this.color = Color.white;
    }

    Use(passEncoder, viewProjectionMatrix, modelMatrix) {
        // ustaw pipeline i bind group
        this.shader.Use(passEncoder);

        // ustaw uniformy
        this.shader.SetColor(this.color);
        this.shader.SetLightDirection(Graphics.lightDirection);
        this.shader.SetLightColor(Graphics.lightColor);
        this.shader.SetAmbientLightColor(Graphics.ambientLightColor);
        this.shader.SetViewProjectionMatrix(viewProjectionMatrix);
        this.shader.SetModelMatrix(modelMatrix);
    }

}
