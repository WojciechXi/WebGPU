class AmbientLight extends Behaviour {

    constructor() {
        super();
        const object = this;

        new Property(object, 'color', Color32.white);
        new Property(object, 'lightBuffer', new Buffer(4));
        new Property(object, 'lightBindGroup', GPU.CreateBindGroup({
            label: 'AmbientLightBindGroup',
            layout: GPU.CreateBindGroupLayout({
                label: 'AmbientLightBindGroupLayout',
                entries: [
                    { binding: 0, visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT, buffer: { type: 'uniform' }, }
                ],
            }),
            entries: [
                this.lightBuffer.GetBindGroupEntry(0),
            ],
        }));
    }

    Update() {
        this.lightBuffer.Set({
            0: this.color
        });
    }

}