class AmbientLight extends Behaviour {

    Init() {
        this.color = Color32.white;

        this.lightBuffer = new Buffer(4); //color
        this.lightBindGroup = GPU.CreateBindGroup({
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
        });
    }

    Update() {
        this.lightBuffer.Set({
            0: this.color
        });
    }

}