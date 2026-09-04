class MeshRenderer extends Renderer {

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

    OnDraw(renderPass, camera) {
        if (!this.sharedMesh) return;

        if (renderPass.name === 'shadowRenderPass') {
            if (!this.castShadows) return;
            for (let i = 0; i < this.sharedMesh.subMeshCount; i++) {
                renderPass.DrawMesh(this.sharedMesh, i, this.transform.transformBuffer.buffer);
            }
        } else if (renderPass.name == 'gBufferRenderPass') {
            for (let i = 0; i < this.sharedMesh.subMeshCount; i++) {
                (this.materials[i] ?? Engine.defaultMaterial).Use(renderPass);
                renderPass.DrawMesh(this.sharedMesh, i, this.transform.transformBuffer.buffer);
            }
        }
    }

}
