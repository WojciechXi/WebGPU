class Material {

    constructor(shader) {
        this.shader = shader;
        this.color = Color.red;              // Float32Array [r,g,b,a]
        this.lightDirection = Vector3.right; // Float32Array [x,y,z]
    }

    Use(passEncoder, viewProjectionMatrix, modelMatrix) {
        // ustaw pipeline i bind group
        this.shader.Use(passEncoder);

        // ustaw uniformy
        this.shader.SetColor(this.color);
        this.shader.SetLightDirection(this.lightDirection);
        this.shader.SetViewProjectionMatrix(viewProjectionMatrix);
        this.shader.SetModelMatrix(modelMatrix);
    }

}
