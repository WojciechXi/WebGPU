class Buffer {

    constructor(size, data = { usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST }, type = Float32Array) {
        this.size = size;
        this.data = data;
        this.type = type;
        this.values = new (this.type)(size);
        this.buffer = GPU.CreateBuffer({
            size: size * 4,
            usage: this.data.usage ?? GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        });
    }

    Resize(newSize) {
        this.size = newSize;
        this.buffer.destroy();
        this.values = new (this.type)(newSize);
        this.buffer = GPU.CreateBuffer({
            size: newSize * 4,
            usage: this.data.usage ?? GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        });
    }

    Set(array, offset = 0, autoWriteBuffer = true) {
        const object = this;

        if (array.constructor.name == 'Object') {
            Object.keys(array).forEach(function (offset) {
                object.Set(array[offset], parseInt(offset), false);
            });
        } else {
            this.values.set(array, offset);
        }

        if (autoWriteBuffer) this.WriteBuffer();
    }

    WriteBuffer() {
        GPU.Queue.writeBuffer(this.buffer, 0, this.values);
    }

    GetBindGroupEntry(binding = 0) {
        return { binding: binding, resource: { buffer: this.buffer } };
    }

    Destroy() {
        this.buffer.destroy();
    }

    New(array, offset = 0) {
        this.buffer.destroy();
        this.buffer = GPU.CreateBuffer({
            size: this.size,
            usage: this.data.usage ?? GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        });

        this.Set(array, offset);
    }
}