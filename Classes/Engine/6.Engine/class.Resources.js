class Resources {

    static {
        this.resources = {};
    }

    static Get(path, callback = null) {
        const resource = this.resources[path] ?? null
        if (callback) callback(resource);
        return resource;
    }

    static Sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    static Init(callback, onStep) {
        const object = this;
        Ajax.Get('/resources.php', async function (paths) {
            paths = JSON.parse(paths);
            const keys = Object.keys(paths);
            for (const index in keys) {
                const path = keys[index];
                const meta = paths[path];

                if (meta.pathInfo.extension == 'gltf') {
                    await Importer.GLTF(meta.pathInfo.dirname, `${meta.pathInfo.filename}.${meta.pathInfo.extension}`, function (meshes, gltfMaterials) {
                        object.resources[path] = {
                            meshes: meshes,
                            materials: gltfMaterials,
                        };
                    });
                } else if (meta.pathInfo.extension == 'glb') {
                    await Importer.GLB(meta.pathInfo.dirname, `${meta.pathInfo.filename}.${meta.pathInfo.extension}`, function (data) {
                        object.resources[path] = new Asset({
                            _gameObject: data.gameObject,
                            _animations: data.animations,
                            _materials: data.materials,
                            _meshes: data.meshes,
                        });
                    });
                } else if (meta.pathInfo.extension == 'wgsl') {
                    const response = await fetch(path);
                    object.resources[path] = await response.text();
                } else if (meta.mimeType.startsWith('image/')) {
                    await loadBitmap(path, function (bitmap, image) {
                        object.resources[path] = bitmap;
                    });
                }

                if (onStep) onStep(parseInt(index) + 1, keys.length, path);
            }

            callback();
        });
    }

}