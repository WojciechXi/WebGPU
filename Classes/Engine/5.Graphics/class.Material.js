class Material extends Obj {

    static {
        console.log('Material class loaded');
    }

    constructor(data = {}) {
        super();
        this.name = data.name ?? 'Material';
        this.shader = data.shader ?? '';

        this.color = data.color ?? Color.white;

        this.roughness = data.roughness ?? 1;
        this.metallic = data.metallic ?? 1;
        this.occlusion = data.occlusion ?? 1;
        this.alphaCutoff = data.alphaCutoff ?? 0.5;

        this.materialValues = new Float32Array(4 + 4); //color, pbr
        this.materialBuffer = GPU.CreateBuffer({
            label: 'material buffer',
            size: this.materialValues.length * 4,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        });
        this.materialBindGroup = GPU.CreateBindGroup({
            label: 'MaterialBindGroup',
            layout: Graphics.materialBindGroupLayout,
            entries: [
                { binding: 0, resource: { buffer: this.materialBuffer } },
            ],
        });

        this.sampler = GPU.CreateSampler({
            addressModeU: 'repeat',
            addressModeV: 'repeat',
            magFilter: 'linear',
            minFilter: 'linear',
            mipmapFilter: 'linear',
        });

        this.textures = {};
        this.SetTexture('albedo', data.albedo ?? Color.white);
        this.SetTexture('normal', new Color(0.5, 0.5, 1, 1));
        this.SetTexture('roughness', Color.white);
        this.SetTexture('metallic', Color.black);
        this.SetTexture('occlusion', Color.white);

        this.pbrBindGroup = GPU.CreateBindGroup({
            label: 'gBufferBindGroup',
            layout: Graphics.pbrBindGroupLayout,
            entries: [
                { binding: 0, resource: this.sampler },
                { binding: 1, resource: this.textures.albedo.createView() },
                { binding: 2, resource: this.textures.normal.createView() },
                { binding: 3, resource: this.textures.roughness.createView() },
                { binding: 4, resource: this.textures.metallic.createView() },
                { binding: 5, resource: this.textures.occlusion.createView() },
            ],
        });
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
        this.pbrBindGroup = GPU.CreateBindGroup({
            label: 'gBufferBindGroup',
            layout: Graphics.pbrBindGroupLayout,
            entries: [
                { binding: 0, resource: this.sampler },
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
            renderPass.SetBindGroup(0, camera.cameraBindGroup);

            this.materialValues.set(this.color, 0);
            this.materialValues.set([this.roughness, this.metallic, this.occlusion, this.alphaCutoff], 4);
            GPU.Queue.writeBuffer(this.materialBuffer, 0, this.materialValues);
            renderPass.SetBindGroup(2, this.materialBindGroup);

            renderPass.SetBindGroup(3, this.pbrBindGroup);

            return true;
        }

        return false;
    }

}
