class AmbientLight extends Behaviour {

    Init() {
        this.color = Color32.white;

        this.lightValues = new Float32Array(4); //color
        this.lightBuffer = GPU.CreateBuffer({
            label: 'uniform buffer',
            size: this.lightValues.length * 4,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        });
        this.lightBindGroup = GPU.CreateBindGroup({
            label: 'ViewBindGroup',
            layout: Graphics.viewBindGroupLayout,
            entries: [
                { binding: 0, resource: { buffer: this.lightBuffer } },
            ],
        });
    }

    Update() {
        this.lightValues.set(this.color, 0);
        GPU.Queue.writeBuffer(this.lightBuffer, 0, this.lightValues);
    }

}