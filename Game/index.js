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

            const litShader = new Shader(Resources.Get('/Resources/Shaders/Lit.wgsl'));
            litShader.Compile();

            const glassShader = new Shader(Resources.Get('/Resources/Shaders/Glass.wgsl'));
            glassShader.Compile();

            let materials = {};

            materials.Default = new Material({
                name: 'Default',
                color: Color32.white,
                shader: litShader,
            });

            materials.Glass = new Material({
                name: 'Glass',
                color: Color32.red,
                shader: glassShader,
            });

            const ambientLightGameObject = new GameObject("Ambient Light");
            const ambientLight = ambientLightGameObject.AddComponent(AmbientLight);
            ambientLight.color.Set(0.8, 0.9, 1, 0.25);
            engine.scene.ambientLight = ambientLight;

            const directionalLightGameObject = new GameObject('Directional Light');
            directionalLightGameObject.transform.rotation = Quaternion.FromEuler(45, 0, -135);
            directionalLightGameObject.transform.position = Vector3.Multiply(directionalLightGameObject.transform.back, 25);
            const directionalLight = directionalLightGameObject.AddComponent(DirectionalLight);
            directionalLight.color.Set(1, 1, 1, 0.75);
            engine.scene.directionalLight = directionalLight;

            const testCameraGameObject = new GameObject('Test Camera');
            testCameraGameObject.transform.position = new Vector3(0, 1, -5);
            const testCamera = testCameraGameObject.AddComponent(Camera);
            testCamera.rect.width = 0.5;
            testCameraGameObject.AddComponent(Test);

            const cameraGameObject = new GameObject('Camera');
            cameraGameObject.transform.position = new Vector3(-1, 1, -5);
            const camera = cameraGameObject.AddComponent(Camera);
            camera.rect.x = 0.5;
            camera.rect.width = 0.5;

            Resources.Get('/Resources/Primitives/Cube.gltf', function (gltf) {
                const gameObject = new GameObject('Cube');

                for (const mesh of gltf.meshes) {
                    const meshGameObject = new GameObject(mesh.name);
                    meshGameObject.transform.SetParent(gameObject.transform);
                    const meshRenderer = meshGameObject.AddComponent(MeshRenderer);
                    meshRenderer.mesh = mesh;
                    meshRenderer.materials = [materials.Default];

                    const boxCollider = meshGameObject.AddComponent(BoxCollider);
                }
            });

            Resources.Get('/Resources/Primitives/Sphere.gltf', function (gltf) {
                const gameObject = new GameObject('Sphere');
                gameObject.transform.position = new Vector3(0, 3, 0);

                for (const mesh of gltf.meshes) {
                    const meshGameObject = new GameObject(mesh.name);
                    meshGameObject.transform.SetParent(gameObject.transform);
                    const meshRenderer = meshGameObject.AddComponent(MeshRenderer);
                    meshRenderer.mesh = mesh;
                    meshRenderer.materials = [materials.Default];

                    const sphereCollider = meshGameObject.AddComponent(SphereCollider);
                    const rigidbody = meshGameObject.AddComponent(Rigidbody);
                }
            });

            return;

            Resources.Get('/Resources/Models/Krakow.gltf', function (gltf) {
                const gameObject = new GameObject('Krakow');

                for (const mesh of gltf.meshes) {
                    const meshGameObject = new GameObject(mesh.name);
                    meshGameObject.transform.SetParent(gameObject.transform);
                    const meshRenderer = meshGameObject.AddComponent(MeshRenderer);
                    meshRenderer.mesh = mesh;
                    meshRenderer.materials = [];
                    mesh.subMeshes.forEach(function (subMesh) {
                        if (subMesh.material == 'Glass') meshRenderer.castShadows = false;
                        if (materials.hasOwnProperty(subMesh.material)) {
                            meshRenderer.materials.push(materials[subMesh.material]);
                        } else {
                            const m = gltf.materials.find(function (m) { return m.name == subMesh.material; });

                            const material = materials[subMesh.material] = new Material({
                                name: subMesh.material,
                                shader: litShader,
                            });

                            Resources.Get(`/Resources/Textures/${material.name}/Albedo.webp`, function (texture) {
                                if (texture) material.SetTexture('albedo', texture);
                            });

                            Resources.Get(`/Resources/Textures/${material.name}/Normal.webp`, function (texture) {
                                if (texture) material.SetTexture('normal', texture);
                            });

                            Resources.Get(`/Resources/Textures/${material.name}/Roughness.webp`, function (texture) {
                                if (texture) material.SetTexture('roughness', texture);
                            });

                            Resources.Get(`/Resources/Textures/${material.name}/Metallic.webp`, function (texture) {
                                if (texture) material.SetTexture('metallic', texture);
                            });

                            Resources.Get(`/Resources/Textures/${material.name}/Occlusion.webp`, function (texture) {
                                if (texture) material.SetTexture('occlussion', texture);
                            });

                            material.Update();

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

                    const boxCollider = meshGameObject.AddComponent(BoxCollider);
                }
            });
        }, function (index, total, path) {
            console.log(`${index}/${total} - ${path}`);
        });
    });
});