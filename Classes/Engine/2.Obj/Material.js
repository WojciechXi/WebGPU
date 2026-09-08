class Material extends Obj {

    static {
        console.log('Material class loaded');
    }

    constructor(shaderOrMaterial) {
        super();
        const object = this;

        let shader = null;
        if (shaderOrMaterial instanceof Shader) shader = shaderOrMaterial;
        else if (shaderOrMaterial instanceof Material) shader = shaderOrMaterial.shader;

        new Property(object, 'renderQueue', 2000);
        new Property(object, 'shader', shader);
        new Property(object, 'materialBuffer', new Buffer(4 + 4)); // color, pbr

        new Property(object, 'textures', {});
        new Property(object, 'sampler', GPU.CreateSampler({
            magFilter: 'linear',
            minFilter: 'linear',
            mipmapFilter: 'linear',
            addressModeU: 'repeat',
            addressModeV: 'repeat',
        }));

        object.SetTexture('albedo', Color32.white);
        object.SetTexture('normal', new Color32(0.5, 0.5, 1, 1));
        object.SetTexture('pbr', new Color32(0, 0, 1, 0));
        object.SetTexture('emissive', Color32.clear);

        object.materialBindGroup = GPU.CreateBindGroup({
            label: 'MaterialBindGroup',
            layout: Graphics.materialBindGroupLayout,
            entries: [
                object.materialBuffer.GetBindGroupEntry(0),
            ],
        });

        object.pbrBindGroup = GPU.CreateBindGroup({
            label: 'gBufferBindGroup',
            layout: Graphics.pbrBindGroupLayout,
            entries: [
                { binding: 0, resource: object.sampler },
                { binding: 1, resource: object.textures.albedo.createView() },
                { binding: 2, resource: object.textures.normal.createView() },
                { binding: 3, resource: object.textures.pbr.createView() },
                { binding: 4, resource: object.textures.emissive.createView() },
            ],
        });

        new Property(object, 'color', Color32.white, {
            assigned: function (color) {
                object.materialBuffer.Set({
                    0: color,
                });
            },
        });

        new Property(object, 'roughness', 1, {
            assigned: function (roughness) {
                object.materialBuffer.Set({
                    4: [roughness],
                });
            },
        });

        new Property(object, 'metallic', 0.1, {
            assigned: function (roughness) {
                object.materialBuffer.Set({
                    5: [roughness],
                });
            },
        });

        new Property(object, 'occlusion', 1, {
            assigned: function (occlusion) {
                object.materialBuffer.Set({
                    6: [occlusion],
                });
            },
        });

        new Property(object, 'alphaCutoff', 0.5, {
            assigned: function (alphaCutoff) {
                object.materialBuffer.Set({
                    7: [alphaCutoff],
                });
            },
        });

        object.cull = 'back';
        object.depthWrite = true;
    }

    SetTexture(name, texture, autoUpdate = false) {
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
                { width, height, depthOrArrayLayers: 1 },
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

        if (autoUpdate) this.Update();
    }

    Update() {
        this.pbrBindGroup = GPU.CreateBindGroup({
            label: 'gBufferBindGroup',
            layout: Graphics.pbrBindGroupLayout,
            entries: [
                { binding: 0, resource: this.sampler },
                { binding: 1, resource: this.textures.albedo.createView() },
                { binding: 2, resource: this.textures.normal.createView() },
                { binding: 3, resource: this.textures.pbr.createView() },
                { binding: 4, resource: this.textures.emissive.createView() },
            ],
        });
    }

}
