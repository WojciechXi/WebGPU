class Material extends Obj {

    static {
        this.materials = [];
    }

    static Find(name) {
        return this.materials.find(s => s.name == name);
    }

    constructor(shaderOrMaterial) {
        super();
        Material.materials.push(this);

        const object = this;

        let shader = null;
        if (shaderOrMaterial instanceof Shader) shader = shaderOrMaterial;
        else if (shaderOrMaterial instanceof Material) shader = shaderOrMaterial.shader;

        new Property(object, 'renderQueue', 2000);
        new Property(object, 'shader', shader, {
            assigned: value => {
                this.renderQueue = value ? value.renderQueue : 2000;
                this.name = value ? value.name : `Material_${this.instanceID}`;
            }
        });
        new Property(object, 'materialBuffer', new Buffer(4 + 4 + 4)); // color, pbr, normalStrength

        new Property(object, 'textures', {});
        new Property(object, 'sampler', new Sampler());

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
                object.sampler.GetBindGroupEntry(0),
                { binding: 1, resource: object.textures.albedo.createView() },
                { binding: 2, resource: object.textures.normal.createView() },
                { binding: 3, resource: object.textures.pbr.createView() },
                { binding: 4, resource: object.textures.emissive.createView() },
            ],
        });

        new Property(object, 'color', Color32.white, { assigned: color => object.materialBuffer.Set({ 0: color, }), });
        new Property(object, 'roughness', 1, { assigned: roughness => object.materialBuffer.Set({ 4: [roughness], }), });
        new Property(object, 'metallic', 0.1, { assigned: metallic => object.materialBuffer.Set({ 5: [metallic], }), });
        new Property(object, 'occlusion', 1, { assigned: occlusion => object.materialBuffer.Set({ 6: [occlusion], }), });
        new Property(object, 'alphaCutoff', 0.5, { assigned: alphaCutoff => object.materialBuffer.Set({ 7: [alphaCutoff], }), });
        new Property(object, 'normalStrength', 0.5, { assigned: normalStrength => object.materialBuffer.Set({ 8: [normalStrength], }), });

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
                this.sampler.GetBindGroupEntry(0),
                { binding: 1, resource: this.textures.albedo.createView() },
                { binding: 2, resource: this.textures.normal.createView() },
                { binding: 3, resource: this.textures.pbr.createView() },
                { binding: 4, resource: this.textures.emissive.createView() },
            ],
        });
    }

}
