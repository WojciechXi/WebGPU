class RenderQueue {

    static queue = [];

    static Submit(mesh, matrixBuffer, material, layer = 0, camera = null, subMeshIndex = 0, castShadows = true, receiveShadows = true, bounds = null) {
        const renderQueue = material.renderQueue ?? material.shader.renderQueue ?? 2000;

        this.queue.push({
            renderQueue: renderQueue,

            material: material,
            shader: material.shader,
            mesh: mesh,

            layer: layer,
            camera: camera,

            matrixBuffer: matrixBuffer,
            subMeshIndex: subMeshIndex,
            castShadows: castShadows,
            receiveShadows: receiveShadows,
            bounds: bounds,
        });
    }

    static FlushShadows(renderPass, layer = 0) {
        this.queue.sort((a, b) => {
            if (a.renderQueue !== b.renderQueue) return a.renderQueue - b.renderQueue;
            if (a.renderQueue >= 3000) return b.depth - a.depth;
            if (a.material.shader.instanceID !== b.material.shader.instanceID) return a.material.shader.instanceID - b.material.shader.instanceID;
            return a.material.instanceID - b.material.instanceID;
        });

        for (let i = 0; i < this.queue.length; i++) {
            const item = this.queue[i];
            if (item.layer != layer) continue;
            if (!item.castShadows) continue;

            const subMesh = item.mesh.GetSubMesh(item.subMeshIndex);

            renderPass.SetVertexBuffer(0, item.mesh.vertexBuffer.buffer);
            renderPass.SetVertexBuffer(1, item.matrixBuffer);
            renderPass.SetBindGroup(3, item.jointsBindGroup ?? renderPass.emptyBindGroup);
            renderPass.SetIndexBuffer(subMesh.triangleBuffer.buffer, 'uint32');
            renderPass.DrawIndexed(subMesh.triangleBuffer.count);
        }
    }

    static Flush(renderPass, camera = null, layer = 0) {
        const planes = GeometryUtility.CalculateFrustumPlanes(camera);

        this.queue.sort((a, b) => {
            if (a.renderQueue !== b.renderQueue) return a.renderQueue - b.renderQueue;
            if (a.renderQueue >= 3000) return b.depth - a.depth;
            if (a.material.shader.instanceID !== b.material.shader.instanceID) return a.material.shader.instanceID - b.material.shader.instanceID;
            return a.material.instanceID - b.material.instanceID;
        });

        let cm = -1;
        for (let i = 0; i < this.queue.length; i++) {
            const item = this.queue[i];
            if (item.layer != layer) continue;
            if (item.camera && item.camera != camera) continue;
            if (!GeometryUtility.TestPlanesAABB(planes, item.bounds)) continue;

            const subMesh = item.mesh.GetSubMesh(item.subMeshIndex);

            if (cm != item.material.instanceID) {
                cm = item.material.instanceID;
                renderPass.SetMaterial(item.material);
            }

            renderPass.SetVertexBuffer(0, item.mesh.vertexBuffer.buffer);
            renderPass.SetVertexBuffer(1, item.matrixBuffer);
            renderPass.SetBindGroup(3, item.jointsBindGroup ?? renderPass.emptyBindGroup);
            renderPass.SetIndexBuffer(subMesh.triangleBuffer.buffer, 'uint32');
            renderPass.DrawIndexed(subMesh.triangleBuffer.count);
        }
    }

    static Clear() {
        this.queue.length = 0;
    }

}