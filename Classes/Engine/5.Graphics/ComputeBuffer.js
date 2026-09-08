class ComputeBuffer {

    constructor(count, stride, type = Float32Array) {
        this.count = count;
        this.stride = stride;
        this.type = type;
        this.values = new (this.type)(count);
        this.buffer = GPU.CreateBuffer({
            size: this.count * this.stride,
            usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC,
        });
    }

    Resize(newSize) {
        this.count = newSize;
        this.buffer.destroy();
        this.values = new (this.type)(newSize);
        this.buffer = GPU.CreateBuffer({
            size: this.count * this.stride,
            usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC,
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
            size: this.count * this.stride,
            usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC,
        });

        this.Set(array, offset);
    }

    async Unmap() {
        return this.buffer.unmap();
    }

    GetMappedRange() {
        return this.buffer.getMappedRange();
    }

    async MapAsync(gpuMapMode = GPUMapMode.READ) {
        return await this.buffer.mapAsync(gpuMapMode);
    }

}