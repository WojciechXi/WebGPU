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
        this.shader.SetLightDirection(Graphics.directionalLightDirection);
        this.shader.SetViewProjectionMatrix(viewProjectionMatrix);
        this.shader.SetModelMatrix(modelMatrix);
    }

}
