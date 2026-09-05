class SkinnedMeshRenderer extends Renderer {

    constructor() {
        super();
        const object = this;

        new Property(object, 'skin', null);
        new Property(object, 'bindings', []);
    }

    OnEnable() {
        this.Bind();
    }

    get bounds() {
        if (!this.sharedMesh) return super.bounds;

        const worldPoints = this.transform.TransformPoints([
            new Vector3(this.sharedMesh.bounds.center.x + this.sharedMesh.bounds.extents.x, this.sharedMesh.bounds.center.y + this.sharedMesh.bounds.extents.y, this.sharedMesh.bounds.center.z + this.sharedMesh.bounds.extents.z),
            new Vector3(this.sharedMesh.bounds.center.x + this.sharedMesh.bounds.extents.x, this.sharedMesh.bounds.center.y + this.sharedMesh.bounds.extents.y, this.sharedMesh.bounds.center.z - this.sharedMesh.bounds.extents.z),
            new Vector3(this.sharedMesh.bounds.center.x + this.sharedMesh.bounds.extents.x, this.sharedMesh.bounds.center.y - this.sharedMesh.bounds.extents.y, this.sharedMesh.bounds.center.z + this.sharedMesh.bounds.extents.z),
            new Vector3(this.sharedMesh.bounds.center.x + this.sharedMesh.bounds.extents.x, this.sharedMesh.bounds.center.y - this.sharedMesh.bounds.extents.y, this.sharedMesh.bounds.center.z - this.sharedMesh.bounds.extents.z),
            new Vector3(this.sharedMesh.bounds.center.x - this.sharedMesh.bounds.extents.x, this.sharedMesh.bounds.center.y + this.sharedMesh.bounds.extents.y, this.sharedMesh.bounds.center.z + this.sharedMesh.bounds.extents.z),
            new Vector3(this.sharedMesh.bounds.center.x - this.sharedMesh.bounds.extents.x, this.sharedMesh.bounds.center.y + this.sharedMesh.bounds.extents.y, this.sharedMesh.bounds.center.z - this.sharedMesh.bounds.extents.z),
            new Vector3(this.sharedMesh.bounds.center.x - this.sharedMesh.bounds.extents.x, this.sharedMesh.bounds.center.y - this.sharedMesh.bounds.extents.y, this.sharedMesh.bounds.center.z + this.sharedMesh.bounds.extents.z),
            new Vector3(this.sharedMesh.bounds.center.x - this.sharedMesh.bounds.extents.x, this.sharedMesh.bounds.center.y - this.sharedMesh.bounds.extents.y, this.sharedMesh.bounds.center.z - this.sharedMesh.bounds.extents.z),
        ]);

        const min = Vector3.positiveInfinity;
        const max = Vector3.negativeInfinity;

        for (const v of worldPoints) {
            if (v.x < min.x) min.x = v.x;
            if (v.y < min.y) min.y = v.y;
            if (v.z < min.z) min.z = v.z;

            if (v.x > max.x) max.x = v.x;
            if (v.y > max.y) max.y = v.y;
            if (v.z > max.z) max.z = v.z;
        }

        return Bounds.FromMinMax(min, max);
    }

    Bind() {
        if (!this.skin) return null;

        const jointCount = this.skin.jointPaths.length;

        for (let i = 0; i < jointCount; i++) {
            const path = this.skin.jointPaths[i];

            let currentTransform = this.transform;
            for (let childIndex of path) {
                currentTransform = currentTransform.children[childIndex];
            }

            this.bindings[i] = currentTransform;
        }
    }

    updateJointMatrices() {
        const jointCount = this.bindings.length;
        const floatArray = new Float32Array(jointCount * 16);

        for (let i = 0; i < jointCount; i++) {
            const boneTransform = this.bindings[i];
            const boneMatrix = boneTransform.matrix4x4;
            const invBindMatrix = this.skin.inverseBindMatrices[i];

            floatArray.set(Matrix4x4.Multiply(boneMatrix, invBindMatrix, boneMatrix), i * 16);
        }

        return floatArray;
    }

    // OnDraw(renderPass, camera) {
    //     if (!this.sharedMesh) return;

    //     if (!this.jointsBindGroup) {
    //         this.jointsBuffer = new Buffer(64 * 16, { usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST, });
    //         this.jointsBindGroup = GPU.CreateBindGroup({
    //             label: 'JointBindGroup',
    //             layout: Graphics.jointsBindGroupLayout,
    //             entries: [
    //                 this.jointsBuffer.GetBindGroupEntry(0),
    //             ],
    //         });
    //     }

    //     this.jointsBuffer.Set(this.updateJointMatrices());

    //     if (renderPass.name === 'shadowRenderPass') {
    //         if (!this.castShadows) return;
    //         for (let i = 0; i < this.sharedMesh.subMeshCount; i++) {
    //             renderPass.DrawSkinnedMesh(this.sharedMesh, i, this.transform.transformBuffer.buffer, this.jointsBindGroup);
    //         }
    //     } else if (renderPass.name == 'gBufferRenderPass') {
    //         for (let i = 0; i < this.materials.length && this.sharedMesh.subMeshCount; i++) {
    //             renderPass.SetMaterial(this.materials[i] ?? Engine.emptyMaterial);
    //             renderPass.DrawSkinnedMesh(this.sharedMesh, i, this.transform.transformBuffer.buffer, this.jointsBindGroup);
    //         }
    //     }
    // }

}
