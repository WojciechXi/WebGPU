class Sampler {

    constructor(filter = 'linear', addressMode = 'repeat', lodMinClamp = 0, lodMaxClamp = 32, maxAnisotropy = 1, compare = undefined) {
        const descriptor = {
            addressModeU: addressMode, // clamp-to-edge | repeat | mirror-repeat
            addressModeV: addressMode, // clamp-to-edge | repeat | mirror-repeat
            magFilter: filter, // nearest | linear
            minFilter: filter, // nearest | linear
            mipmapFilter: filter, // nearest | linear
            lodMinClamp: lodMinClamp,
            lodMaxClamp: lodMaxClamp,
            // maxAnisotropy > 1 wymaga filtrów linear
            maxAnisotropy: filter === 'linear' ? maxAnisotropy : 1,
        };

        // Klucz compare dołączamy tylko wtedy, gdy jest zdefiniowany
        if (compare !== undefined) { // never | less | equal | less-equal | greater | not-equal | greater-equal | always
            descriptor.compare = compare;
            this.type = 'comparison';
        } else if (filter === 'linear') this.type = 'filtering';
        else this.type = 'non-filtering';

        this.sampler = GPU.CreateSampler(descriptor);
    }

    GetBindGroupLayoutEntry(binding = 0, visibility = GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT) {
        return {
            binding: binding,
            visibility: visibility,
            sampler: {
                type: this.type,
            },
        };
    }

    GetBindGroupEntry(binding = 0) {
        return {
            binding: binding,
            resource: this.sampler
        };
    }

}