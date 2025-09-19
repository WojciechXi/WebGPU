class Material {

    constructor(shader) {
        this.shader = shader;
        this.color = Color.red;
        this.lightDirection = Vector3.down;
    }

    Use(viewProjectionMatrix, modelMatrix) {
        this.shader.Use();

        this.shader.SetColor(this.color);
        this.shader.SetLightDirection(this.lightDirection);

        this.shader.SetViewProjectionMatrix(viewProjectionMatrix);
        this.shader.SetModelMatrix(modelMatrix);
    }

}