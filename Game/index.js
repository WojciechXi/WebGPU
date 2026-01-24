async function loadBitmap(src, callback) {
    return new Promise((resolve, reject) => {
        const image = new Image();
        image.onerror = reject;
        image.onload = async function (event) {
            const bitmap = await createImageBitmap(image);
            resolve(bitmap);
            callback(bitmap, image);
        };
        image.src = src;
    })
}

window.addEventListener('DOMContentLoaded', async function (event) {
    const device = await GPU.Request();
    const engine = new Engine();

    engine.Init(function (engine) {
        Resources.Init(function () {
            engine.Awake();
            engine.Start();

            let materials = {};

            const litShader = new Shader(Resources.Get('/Resources/Shaders/Lit.wgsl'));
            litShader.Compile();

            const defaultMaterial = materials.default = new Material({
                name: 'Default',
                color: Color32.green,
                shader: litShader,
            });

            const ambientLightGameObject = new GameObject("Ambient Light");
            const ambientLight = ambientLightGameObject.AddComponent(AmbientLight);
            ambientLight.color.Set(0.8, 0.9, 1, 0.25);
            engine.scene.ambientLight = ambientLight;

            const directionalLightGameObject = new GameObject('Directional Light');
            directionalLightGameObject.transform.rotation = Quaternion.FromEuler(45, 0, 15);
            directionalLightGameObject.transform.position = Vector3.Multiply(directionalLightGameObject.transform.back, 25);
            const directionalLight = directionalLightGameObject.AddComponent(DirectionalLight);
            directionalLight.color.Set(1, 1, 1, 0.75);
            engine.scene.directionalLight = directionalLight;

            const cameraGameObject = new GameObject('Camera');
            cameraGameObject.transform.position = new Vector3(0, 1, -5);
            const camera = cameraGameObject.AddComponent(Camera);
            cameraGameObject.AddComponent(Test);

            Resources.Get('/Resources/Models/Krakow.gltf', function (gltf) {
                const gameObject = new GameObject('Krakow');

                for (const mesh of gltf.meshes) {
                    const meshGameObject = new GameObject(mesh.name);
                    meshGameObject.transform.SetParent(gameObject.transform);
                    const meshRenderer = meshGameObject.AddComponent(MeshRenderer);

                    meshRenderer.mesh = mesh;
                    meshRenderer.materials = [];
                    mesh.subMeshes.forEach(function (subMesh) {
                        if (materials.hasOwnProperty(subMesh.material)) {
                            meshRenderer.materials.push(materials[subMesh.material]);
                        } else {
                            const m = gltf.materials.find(function (m) { return m.name == subMesh.material; });

                            const material = materials[subMesh.material] = new Material({
                                name: subMesh.material,
                                shader: litShader,
                            });

                            Resources.Get(`/Images/${material}/Albedo.webp`, function (texture) {
                                if (texture) material.SetTexture('albedo', texture);
                            });

                            Resources.Get(`/Images/${material}/Normal.webp`, function (texture) {
                                if (texture) material.SetTexture('normal', texture);
                            });

                            Resources.Get(`/Images/${material}/Roughness.webp`, function (texture) {
                                if (texture) material.SetTexture('roughness', texture);
                            });

                            Resources.Get(`/Images/${material}/Metallic.webp`, function (texture) {
                                if (texture) material.SetTexture('metallic', texture);
                            });

                            Resources.Get(`/Images/${material}/Occlusion.webp`, function (texture) {
                                if (texture) material.SetTexture('occlussion', texture);
                            });

                            if (m && m.pbrMetallicRoughness) {
                                const pbr = m.pbrMetallicRoughness;
                                if (pbr.baseColorFactor) {
                                    const color = pbr.baseColorFactor;
                                    material.color.Set(color[0], color[1], color[2], color[3]);
                                }

                                material.metallic = pbr.metallicFactor ?? 0;
                                material.roughness = pbr.roughnessFactor ?? 0;
                            }

                            meshRenderer.materials.push(material);
                        }
                    });
                }
            })
        }, function (index, total, path) {
            console.log(`${index}/${total} - ${path}`);
        });
    });
});