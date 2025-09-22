class Material {

    constructor(shader) {
        this.shader = shader;
        this.color = Color.white;
        this._diffuse = null;
        this._texture = null;

        const uniformSize = (16 + 16 + 16 + 4 + 4 + 4 + 4) * 4;
        this.uniformBuffer = GPU.CreateBuffer({
            label: 'uniform buffer',
            size: uniformSize,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        });

        // Float32Array do łatwego ustawiania wartości
        this.uniformValues = new Float32Array(uniformSize / 4);

        //sampler
        this.sampler = GPU.CreateSampler({
            addressModeU: 'repeat',
            addressModeV: 'repeat',
            magFilter: 'linear',
            minFilter: 'linear',
            mipmapFilter: 'linear',
        });

        this.diffuse = null;
    }

    get diffuse() {
        return this._diffuse;
    }
    set diffuse(diffuse) {
        this._diffuse = diffuse;

        const width = this._diffuse ? this._diffuse.width : 1;
        const height = this._diffuse ? this._diffuse.height : 1;

        this._texture = GPU.CreateTexture({
            size: [width, height, 1],
            format: 'rgba8unorm',
            usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST | GPUTextureUsage.RENDER_ATTACHMENT,
        });

        if (this._diffuse) {
            GPU.Queue.copyExternalImageToTexture(
                { source: this._diffuse },
                { texture: this._texture },
                [width, height, 1]
            );
        }

        this.bindGroup = GPU.CreateBindGroup({
            layout: this.shader.pipeline.getBindGroupLayout(0),
            entries: [
                { binding: 0, resource: { buffer: this.uniformBuffer } },
                { binding: 1, resource: this.sampler },
                { binding: 2, resource: this._texture.createView() },
            ],
        });
    }

    Use(passEncoder, viewProjectionMatrix, viewProjectionInverseMatrix, modelMatrix) {
        // ustaw pipeline i bind group
        passEncoder.setPipeline(this.shader.pipeline);
        passEncoder.setBindGroup(0, this.bindGroup);

        this.uniformValues.set(viewProjectionMatrix, 0);
        this.uniformValues.set(viewProjectionInverseMatrix, 16);
        this.uniformValues.set(modelMatrix, 32);

        this.uniformValues.set(Graphics.lightDirection, 48);
        this.uniformValues.set(Graphics.lightColor, 52);
        this.uniformValues.set(Graphics.ambientLightColor, 56);

        this.uniformValues.set(this.color, 60);

        GPU.Queue.writeBuffer(this.uniformBuffer, 0, this.uniformValues);
    }

}
