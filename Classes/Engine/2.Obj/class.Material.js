class Material extends Obj {

    static {
        console.log('Material class loaded');
    }

    constructor(data = {}) {
        super(data, {
            shader: { value: data._shader ?? data.shader ?? null, },
            color: { value: data._color ?? data.color ?? Color32.white, },
            emissive: { value: data._emissive ?? data.emissive ?? new Color32(0, 0, 0, 0), },
            roughness: { value: data._roughness ?? data.roughness ?? 1, },
            metallic: { value: data._metallic ?? data.metallic ?? 0.1, },
            occlusion: { value: data._occlusion ?? data.occlusion ?? 1, },
            alphaCutoff: { value: data._alphaCutoff ?? data.alphaCutoff ?? 0.5, },
            sampler: {
                value: GPU.CreateSampler({
                    addressModeU: 'repeat',
                    addressModeV: 'repeat',
                    magFilter: 'nearest',
                    minFilter: 'nearest',
                    mipmapFilter: 'nearest',
                }),
                get: false,
                set: false,
            },
            textures: {
                value: data._textures ?? data.textures ?? {},
                set: false,
            },
            materialBuffer: {
                value: new Buffer(4 + 4 + 4),
                set: false,
            },
        });

        this.SetTexture('albedo', data.albedo ?? Color32.white);
        this.SetTexture('normal', new Color32(0.5, 0.5, 1, 1));
        this.SetTexture('roughness', Color32.white);
        this.SetTexture('metallic', Color32.black);
        this.SetTexture('occlusion', Color32.white);

        this.materialBindGroup = GPU.CreateBindGroup({
            label: 'MaterialBindGroup',
            layout: Graphics.materialBindGroupLayout,
            entries: [
                this.materialBuffer.GetBindGroupEntry(0),
            ],
        });
        this.pbrBindGroup = GPU.CreateBindGroup({
            label: 'gBufferBindGroup',
            layout: Graphics.pbrBindGroupLayout,
            entries: [
                { binding: 0, resource: this._sampler },
                { binding: 1, resource: this.textures.albedo.createView() },
                { binding: 2, resource: this.textures.normal.createView() },
                { binding: 3, resource: this.textures.roughness.createView() },
                { binding: 4, resource: this.textures.metallic.createView() },
                { binding: 5, resource: this.textures.occlusion.createView() },
            ],
        });
    }

    SetTexture(name, texture) {
        if (texture instanceof Color || texture instanceof Color32) {
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
        this.pbrBindGroup = GPU.CreateBindGroup({
            label: 'gBufferBindGroup',
            layout: Graphics.pbrBindGroupLayout,
            entries: [
                { binding: 0, resource: this._sampler },
                { binding: 1, resource: this.textures.albedo.createView() },
                { binding: 2, resource: this.textures.normal.createView() },
                { binding: 3, resource: this.textures.roughness.createView() },
                { binding: 4, resource: this.textures.metallic.createView() },
                { binding: 5, resource: this.textures.occlusion.createView() },
            ],
        });
    }

    Use(renderPass, camera) {
        let renderPipeline = this.shader.Use(renderPass);
        if (renderPipeline) {
            this.materialBuffer.Set({
                0: this.color,
                4: this.emissive,
                8: [this.roughness, this.metallic, this.occlusion, this.alphaCutoff],
            });

            renderPass.SetBindGroup(1, this.materialBindGroup);
            renderPass.SetBindGroup(2, this.pbrBindGroup);

            return true;
        }

        return false;
    }

}
