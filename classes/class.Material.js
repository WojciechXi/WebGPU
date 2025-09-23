class Material {

    constructor(shader) {
        this.shader = shader;
        this.color = Color.white;
        this._diffuse = null;
        this._texture = null;

        const uniformSize = 96;
        this.uniformBuffer = GPU.CreateBuffer({
            label: 'uniform buffer',
            size: uniformSize * 4,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        });

        // Float32Array do łatwego ustawiania wartości
        this.uniformValues = new Float32Array(uniformSize);

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
        } else {
            GPU.Queue.writeTexture(
                { texture: this._texture },
                new Uint8Array([255, 255, 255, 255]),
                { bytesPerRow: width * 4 },
                { width, height, depthOrArrayLayers: 1 }
            );
        }
    }

    Use(renderPass, pipeline, viewMatrix, projectionMatrix, viewProjectionMatrix, viewProjectionInverseMatrix, modelMatrix) {
        // ustaw pipeline i bind group
        if (pipeline) {
            renderPass.setBindGroup(0, GPU.CreateBindGroup({
                layout: pipeline.getBindGroupLayout(0),
                entries: [
                    { binding: 0, resource: { buffer: this.uniformBuffer } },
                ],
            }));
        } else {
            renderPass.setPipeline(this.shader.pipeline);
            renderPass.setBindGroup(0, GPU.CreateBindGroup({
                layout: this.shader.pipeline.getBindGroupLayout(0),
                entries: [
                    { binding: 0, resource: { buffer: this.uniformBuffer } },
                    { binding: 1, resource: this.sampler },
                    { binding: 2, resource: this._texture.createView() },
                ],
            }));
        }

        this.uniformValues.set(viewMatrix, 0);
        this.uniformValues.set(projectionMatrix, 16);
        this.uniformValues.set(viewProjectionMatrix, 32);
        this.uniformValues.set(viewProjectionInverseMatrix, 48);
        this.uniformValues.set(modelMatrix, 64);

        this.uniformValues.set(Graphics.lightDirection, 80);
        this.uniformValues.set(Graphics.lightColor, 84);
        this.uniformValues.set(Graphics.ambientLightColor, 88);

        this.uniformValues.set(this.color, 92);

        GPU.Queue.writeBuffer(this.uniformBuffer, 0, this.uniformValues);
    }

}
