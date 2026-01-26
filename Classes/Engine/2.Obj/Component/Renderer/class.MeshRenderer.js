class MeshRenderer extends Renderer {

    Init() {
        super.Init();

        this.receiveShadows = true;
        this.castShadows = true;

        this.materials = [null];
        this.mesh = null;
    }

    // Update() {
    //     if (this.mesh) {
    //         const meshBounds = this.mesh.bounds;
    //         const meshBoundsMin = meshBounds.min;
    //         const meshBoundsMax = meshBounds.max;

    //         const center = Vector3.Add(meshBoundsMin, meshBoundsMax).Divide(2);
    //         const halfExtents = Vector3.Subtract(meshBoundsMax, meshBoundsMin).Divide(2);

    //         this.localBounds.Set(center.Scale(this.transform.scale), halfExtents.Scale(this.transform.scale).Multiply(2));
    //     } else {
    //         this.localBounds.Clear();
    //         this.bounds.Clear();
    //     }
    // }

    get localBounds() {
        if (!this.mesh) return super.bounds;
        return new Bounds(this.mesh.bounds.center.Clone(), this.mesh.bounds.extents.Clone());
    }
    get bounds() {
        if (!this.mesh) return super.bounds;
        const lb = this.mesh.bounds;
        const c = lb.center;
        const hx = lb.extents.x;
        const hy = lb.extents.y;
        const hz = lb.extents.z;

        const worldPoints = this.transform.TransformPoints([
            new Vector3(c.x + hx, c.y + hy, c.z + hz),
            new Vector3(c.x + hx, c.y + hy, c.z - hz),
            new Vector3(c.x + hx, c.y - hy, c.z + hz),
            new Vector3(c.x + hx, c.y - hy, c.z - hz),
            new Vector3(c.x - hx, c.y + hy, c.z + hz),
            new Vector3(c.x - hx, c.y + hy, c.z - hz),
            new Vector3(c.x - hx, c.y - hy, c.z + hz),
            new Vector3(c.x - hx, c.y - hy, c.z - hz),
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
        if (!this.mesh || !this.material) return;

        if (renderPass.name === 'shadowRenderPass') {
            if (!this.castShadows) return;
            for (let i = 0; i < this.materials.length && this.mesh.subMeshes.length; i++) {
                renderPass.DrawMesh(this.mesh, i, this.transform.transformBuffer.buffer);
            }
        } else if (renderPass.name == 'gBufferRenderPass') {
            for (let i = 0; i < this.materials.length && this.mesh.subMeshes.length; i++) {
                this.materials[i].Use(renderPass, camera);
                renderPass.DrawMesh(this.mesh, i, this.transform.transformBuffer.buffer);
            }
        }
    }

}
