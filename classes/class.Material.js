class Material {

    static {
        console.log('Material class loaded');
    }

    constructor(data = {}) {
        this.name = data.name ?? 'Material';
        this.shader = data.shader ?? '';
        this.color = data.color ?? Color.white;

        this.textures = {};
        this.SetTexture('albedo', data.albedo ?? Color.white);
        this.SetTexture('normal', data.normal ?? new Color(0.5, 0.5, 1, 1));
        this.SetTexture('roughness', data.roughness ?? Color.white);
        this.SetTexture('metallic', data.metallic ?? Color.black);
        this.SetTexture('occlusion', data.occlusion ?? Color.white);

        const uniformSize = 16 + 16 + 16 + 4 + 4; // modelMatrix, viewMatrix, projectionMatrix, color, pbr
        this.uniformValues = new Float32Array(uniformSize);

        this.sampler = GPU.CreateSampler({
            addressModeU: 'repeat',
            addressModeV: 'repeat',
            magFilter: 'linear',
            minFilter: 'linear',
            mipmapFilter: 'linear',
        });

        this.bindGroups = {};
        this.uniformBuffers = {};
    }

    SetTexture(name, texture) {
        if (texture instanceof Color) {
            const width = 1;
            const height = 1;

            this.textures[name] = GPU.CreateTexture({
                size: [width, height, 1],
                format: 'rgba8unorm',
                usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST,
            });

            GPU.Queue.writeTexture(
                { texture: this.textures[name] },
                new Uint8Array([texture.r * 255, texture.g * 255, texture.b * 255, texture.a * 255]),
                { bytesPerRow: 4 * 4 },
                { width, height, depthOrArrayLayers: 1 }
            );
        } else {
            const width = texture.width;
            const height = texture.height;

            this.textures[name] = GPU.CreateTexture({
                size: [width, height, 1],
                format: 'rgba8unorm',
                usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST,
            });

            GPU.Queue.copyExternalImageToTexture(
                { source: texture },
                { texture: this.textures[name] },
                [width, height, 1]
            );
        }
    }

    Update() {
        this.bindGroups = {};
        this.uniformBuffers = {};
    }

    GetUniformBuffer(renderPass, renderPipeline) {
        if (!renderPipeline) return null;
        if (this.uniformBuffers[renderPass.name]) return this.uniformBuffers[renderPass.name];
        return this.uniformBuffers[renderPass.name] = GPU.CreateBuffer({
            label: 'uniform buffer',
            size: this.uniformValues.length * 4,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        });
    }

    GetBindGroup(renderPass, renderPipeline, uniformBuffer) {
        const _this = this;

        if (!renderPipeline) return null;
        if (_this.bindGroups[renderPass.name]) return _this.bindGroups[renderPass.name];

        let entries = [
            { binding: 0, resource: { buffer: uniformBuffer } },
            { binding: 1, resource: _this.sampler }
        ];

        Object.keys(_this.textures).forEach(function (key, index) {
            let entry = { binding: 2 + index, resource: _this.textures[key].createView() };
            entries.push(entry);
        });

        return _this.bindGroups[renderPass.name] = GPU.CreateBindGroup({
            layout: renderPipeline.getBindGroupLayout(0),
            entries: entries,
        });
    }

    Use(renderPass, modelMatrix, viewMatrix, projectionMatrix) {
        let renderPipeline = this.shader.Use(renderPass);
        if (renderPipeline) {
            let uniformBuffer = this.GetUniformBuffer(renderPass, renderPipeline);
            if (uniformBuffer) {
                let bindGroup = this.GetBindGroup(renderPass, renderPipeline, uniformBuffer);
                if (bindGroup) {
                    this.uniformValues.set(modelMatrix, 0);
                    this.uniformValues.set(viewMatrix, 16);
                    this.uniformValues.set(projectionMatrix, 32);
                    this.uniformValues.set(this.color, 48);
                    this.uniformValues.set([this.smoothness, this.metallic, this.ambientOcclusion], 52);

                    GPU.Queue.writeBuffer(uniformBuffer, 0, this.uniformValues);

                    renderPass.SetBindGroup(0, bindGroup);
                }
            }

            return true;
        }

        return false;
    }

}
