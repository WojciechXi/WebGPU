class AmbientLight extends Behaviour {

    Init() {
        this.color = Color32.white;

        this.lightBuffer = new UniformBuffer(4); //view, projection, viewProjection, inverseView, inverseViewProjection, color, shadowColor
        this.lightBindGroup = GPU.CreateBindGroup({
            label: 'ViewBindGroup',
            layout: Graphics.lightBindGroupLayout,
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