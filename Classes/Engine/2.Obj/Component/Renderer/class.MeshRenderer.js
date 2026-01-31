class MeshRenderer extends Renderer {

    constructor(data = {}, properties = {}) {
        super(data, {
            ...properties,
            target: { value: data._target ?? null, },
            receiveShadows: { value: data._receiveShadows ?? true, },
            castShadows: { value: data._castShadows ?? true, },
            materials: { value: data._materials ?? [null], },
            mesh: { value: data._mesh ?? null },
        });
    }

    get transform() { return this.target ?? super.transform; }
    get isVisible() { return this.materials.length && this.mesh; }

    get localBounds() {
        if (!this.mesh) return super.bounds;
        return new Bounds(this.mesh.bounds.center.Clone(), this.mesh.bounds.size);
    }
    get bounds() {
        if (!this.mesh) return super.bounds;

        const worldPoints = this.transform.TransformPoints([
            new Vector3(this.mesh.bounds.center.x + this.mesh.bounds.extents.x, this.mesh.bounds.center.y + this.mesh.bounds.extents.y, this.mesh.bounds.center.z + this.mesh.bounds.extents.z),
            new Vector3(this.mesh.bounds.center.x + this.mesh.bounds.extents.x, this.mesh.bounds.center.y + this.mesh.bounds.extents.y, this.mesh.bounds.center.z - this.mesh.bounds.extents.z),
            new Vector3(this.mesh.bounds.center.x + this.mesh.bounds.extents.x, this.mesh.bounds.center.y - this.mesh.bounds.extents.y, this.mesh.bounds.center.z + this.mesh.bounds.extents.z),
            new Vector3(this.mesh.bounds.center.x + this.mesh.bounds.extents.x, this.mesh.bounds.center.y - this.mesh.bounds.extents.y, this.mesh.bounds.center.z - this.mesh.bounds.extents.z),
            new Vector3(this.mesh.bounds.center.x - this.mesh.bounds.extents.x, this.mesh.bounds.center.y + this.mesh.bounds.extents.y, this.mesh.bounds.center.z + this.mesh.bounds.extents.z),
            new Vector3(this.mesh.bounds.center.x - this.mesh.bounds.extents.x, this.mesh.bounds.center.y + this.mesh.bounds.extents.y, this.mesh.bounds.center.z - this.mesh.bounds.extents.z),
            new Vector3(this.mesh.bounds.center.x - this.mesh.bounds.extents.x, this.mesh.bounds.center.y - this.mesh.bounds.extents.y, this.mesh.bounds.center.z + this.mesh.bounds.extents.z),
            new Vector3(this.mesh.bounds.center.x - this.mesh.bounds.extents.x, this.mesh.bounds.center.y - this.mesh.bounds.extents.y, this.mesh.bounds.center.z - this.mesh.bounds.extents.z),
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

    get material() { return this.materials[0]; }
    set material(material) { this.materials = [material]; }

    OnDraw(renderPass, camera) {
        if (!this.mesh) return;

        if (renderPass.name === 'shadowRenderPass') {
            if (!this.castShadows) return;
            for (let i = 0; i < this.mesh.subMeshCount; i++) {
                renderPass.DrawMesh(this.mesh, i, this.transform.transformBuffer.buffer);
            }
        } else if (renderPass.name == 'gBufferRenderPass') {
            for (let i = 0; i < this.mesh.subMeshCount; i++) {
                (this.materials[i] ?? Engine.Instance.defaultMaterial).Use(renderPass, camera);
                renderPass.DrawMesh(this.mesh, i, this.transform.transformBuffer.buffer);
            }
        }
    }

}
