class Resources {

    static {
        this.resources = {};
    }

    static Sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    static Init(callback) {
        const object = this;
        Ajax.Get('/resources.php', async function (paths) {
            paths = JSON.parse(paths);
            for (const path of Object.keys(paths)) {
                const meta = paths[path];
                if (meta.pathInfo.extension == 'gltf') {
                    await Importer.GLTF(meta.pathInfo.dirname, `${meta.pathInfo.filename}.${meta.pathInfo.extension}`, function (meshes, gltfMaterials) {
                        object.resources[path] = meshes;
                    });
                }
            }

            callback();
        });
    }

}