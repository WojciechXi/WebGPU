class Material {

    static {
        console.log('Material class loaded');
    }

    constructor(shader) {
        this.shader = shader;
        this.color = Color.white;

        this.smoothness = 0;
        this.metallic = 0;
        this.ambientOcclusion = 0;

        const uniformSize = 16 + 16 + 16 + 4 + 4; // modelMatrix, viewMatrix, projectionMatrix, color, pbr
        this.uniformValues = new Float32Array(uniformSize);
        this.uniformBuffer = GPU.CreateBuffer({
            label: 'uniform buffer',
            size: this.uniformValues.length * 4,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        });

        this.sampler = GPU.CreateSampler({
            addressModeU: 'repeat',
            addressModeV: 'repeat',
            magFilter: 'linear',
            minFilter: 'linear',
            mipmapFilter: 'linear',
        });

        this.albedo = null;
        this.normal = null;
        this.ambientOcclusion = null;
        this.heightMap = null;
    }

    Use(renderPass, modelMatrix, viewMatrix, projectionMatrix) {
        let renderPipeline = this.shader.Use(renderPass);
        if (renderPipeline) {
            renderPass.SetBindGroup(0, GPU.CreateBindGroup({
                layout: renderPipeline.getBindGroupLayout(0),
                entries: [
                    { binding: 0, resource: { buffer: this.uniformBuffer } },
                    { binding: 1, resource: this.sampler },
                    { binding: 2, resource: this.albedo.createView() },
                    { binding: 3, resource: this.normal.createView() },
                    { binding: 4, resource: this.ambientOcclusion.createView() },
                    { binding: 5, resource: this.heightMap.createView() },
                ],
            }));

            this.uniformValues.set(modelMatrix, 0);
            this.uniformValues.set(viewMatrix, 16);
            this.uniformValues.set(projectionMatrix, 32);
            this.uniformValues.set(this.color, 48);
            this.uniformValues.set([this.smoothness, this.metallic, this.ambientOcclusion], 52);

            GPU.Queue.writeBuffer(this.uniformBuffer, 0, this.uniformValues);
            return true;
        }

        return false;
    }

    get albedo() {
        return this._albedo;
    }

    set albedo(albedo) {
        const width = albedo ? albedo.width : 1;
        const height = albedo ? albedo.height : 1;

        this._albedo = GPU.CreateTexture({
            size: [width, height, 1],
            format: 'rgba8unorm',
            usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST,
        });

        if (albedo) {
            GPU.Queue.copyExternalImageToTexture(
                { source: albedo },
                { texture: this._albedo },
                [width, height, 1]
            );
        } else {
            GPU.Queue.writeTexture(
                { texture: this._albedo },
                new Uint8Array([255, 255, 255, 255]),
                { bytesPerRow: width * 4 },
                { width, height, depthOrArrayLayers: 1 }
            );
        }
    }

    get normal() {
        return this._normal;
    }

    set normal(normal) {
        const width = normal ? normal.width : 1;
        const height = normal ? normal.height : 1;

        this._normal = GPU.CreateTexture({
            size: [width, height, 1],
            format: 'rgba8unorm',
            usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST,
        });

        if (normal) {
            GPU.Queue.copyExternalImageToTexture(
                { source: normal },
                { texture: this._normal },
                [width, height, 1]
            );
        } else {
            GPU.Queue.writeTexture(
                { texture: this._normal },
                new Uint8Array([0, 0, 255, 255]),
                { bytesPerRow: width * 4 },
                { width, height, depthOrArrayLayers: 1 }
            );
        }
    }

    get ambientOcclusion() {
        return this._ambientOcclusion;
    }

    set ambientOcclusion(ambientOcclusion) {
        const width = ambientOcclusion ? ambientOcclusion.width : 1;
        const height = ambientOcclusion ? ambientOcclusion.height : 1;

        this._ambientOcclusion = GPU.CreateTexture({
            size: [width, height, 1],
            format: 'rgba8unorm',
            usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST,
        });

        if (ambientOcclusion) {
            GPU.Queue.copyExternalImageToTexture(
                { source: ambientOcclusion },
                { texture: this._ambientOcclusion },
                [width, height, 1]
            );
        } else {
            GPU.Queue.writeTexture(
                { texture: this._ambientOcclusion },
                new Uint8Array([255, 255, 255, 255]),
                { bytesPerRow: width * 4 },
                { width, height, depthOrArrayLayers: 1 }
            );
        }
    }

    get heightMap() {
        return this._heightMap;
    }

    set heightMap(heightMap) {
        const width = heightMap ? heightMap.width : 1;
        const height = heightMap ? heightMap.height : 1;

        this._heightMap = GPU.CreateTexture({
            size: [width, height, 1],
            format: 'rgba8unorm',
            usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST,
        });

        if (heightMap) {
            GPU.Queue.copyExternalImageToTexture(
                { source: heightMap },
                { texture: this._heightMap },
                [width, height, 1]
            );
        } else {
            GPU.Queue.writeTexture(
                { texture: this._heightMap },
                new Uint8Array([0, 0, 0, 255]),
                { bytesPerRow: width * 4 },
                { width, height, depthOrArrayLayers: 1 }
            );
        }
    }

}
