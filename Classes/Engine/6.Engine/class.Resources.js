class Resources {

    static {
        this.resources = {};
    }

    static async Load(path) {
        const object = this;
        if (object.resources[path]) return object.resources[path];

        if (path.endsWith('webp')) {
            await loadBitmap(`/Resources/${path}`, function (bitmap, image) {
                object.resources[path] = bitmap;
            });

            return object.resources[path];
        }

        if (path.endsWith('gltf')) {
            await Importer.GLTF(`/Resources/${path}`, function (meshes, gltfMaterials) {
                object.resources[path] = {
                    meshes: meshes,
                    materials: gltfMaterials,
                };
            });

            return object.resources[path];
        }

        const response = await fetch(`/Resources/${path}`);
        object.resources[path] = await response.text();

        if (path.endsWith('json')) {
            object.resources[path] = JSON.parse(object.resources[path]);
        } else if (path.endsWith('glb')) {
            // await Importer.GLB(meta.pathInfo.dirname, `${meta.pathInfo.filename}.${meta.pathInfo.extension}`, function (data) {
            //     object.resources[path] = new Asset({
            //         _gameObject: data.gameObject,
            //         _animations: data.animations,
            //         _materials: data.materials,
            //         _meshes: data.meshes,
            //     });
            // });
        }

        return object.resources[path];
    }

}