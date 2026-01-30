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

            materials.Emissive = new Material({
                name: 'Emissive',
                color: Color32.red,
                emissive: new Color32(10, 0, 0),
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
            directionalLightGameObject.transform.position = Vector3.Multiply(directionalLightGameObject.transform.back, 25);
            const test2 = directionalLightGameObject.AddComponent(Test2);
            test2.turn.x = 30;
            const directionalLight = directionalLightGameObject.AddComponent(DirectionalLight);
            directionalLight.color.Set(1, 1, 1, 0.75);
            engine.scene.directionalLight = directionalLight;

            const testCameraGameObject = new GameObject('Test Camera');
            testCameraGameObject.transform.position = new Vector3(0, 1, -5);
            const testCamera = testCameraGameObject.AddComponent(Camera);
            // testCamera.rect.width = 0.5;
            testCameraGameObject.AddComponent(Test);

            const cameraGameObject = new GameObject('Camera');
            cameraGameObject.transform.position = new Vector3(-1, 1, -5);
            const camera = cameraGameObject.AddComponent(Camera);
            camera.rect.x = 0.75;
            camera.rect.y = 0.75;
            camera.rect.width = 0.25;
            camera.rect.height = 0.25;

            const planeGameObject = GameObject.Instantiate("Plane", Vector3.zero, Quaternion.identity, null, MeshRenderer, BoxCollider);
            planeGameObject.transform.localScale = new Vector3(10, 1, 10);
            const planeMeshRenderer = planeGameObject.GetComponent(MeshRenderer);
            planeMeshRenderer.material = materials.Default;
            planeMeshRenderer.mesh = Graphics.cubeMesh;

            const sphereGameObject = GameObject.Instantiate("Sphere", new Vector3(0, 2, 0), Quaternion.identity, null, MeshRenderer, SphereCollider, Rigidbody);
            const sphereMeshRenderer = sphereGameObject.GetComponent(MeshRenderer);
            sphereMeshRenderer.material = materials.Default;
            sphereMeshRenderer.mesh = Graphics.sphereMesh;

            const cubeGameObject = GameObject.Instantiate("Cube", new Vector3(2, 2, 0), Quaternion.identity, null, MeshRenderer, BoxCollider, Rigidbody);
            const cubeMeshRenderer = cubeGameObject.GetComponent(MeshRenderer);
            cubeMeshRenderer.material = materials.Default;
            cubeMeshRenderer.mesh = Graphics.cubeMesh;

            const capsuleGameObject = GameObject.Instantiate("Sphere", new Vector3(-2, 2, 0), Quaternion.identity, null, MeshRenderer, CapsuleCollider, Rigidbody);
            const capsuleMeshRenderer = capsuleGameObject.GetComponent(MeshRenderer);
            capsuleMeshRenderer.material = materials.Default;
            capsuleMeshRenderer.mesh = Graphics.cubeMesh;

            Resources.Get('/Resources/Models/Human.glb', function (gltf) {
                const gameObject = new GameObject('Human');
                gameObject.transform.localScale = new Vector3(0.01, 0.01, 0.01);

                for (const mesh of gltf.meshes) {
                    const meshGameObject = new GameObject(mesh.name);
                    meshGameObject.transform.SetParent(gameObject.transform);
                    const meshRenderer = meshGameObject.AddComponent(MeshRenderer);
                    meshRenderer.mesh = mesh;
                    meshRenderer.materials = [];
                    mesh._subMeshes.forEach(function (subMesh) {
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

                    const meshCollider = meshGameObject.AddComponent(MeshCollider);
                }
            });

            // Resources.Get('/Resources/Models/Terrain.gltf', function (gltf) {
            //     const gameObject = new GameObject('Terrain');

            //     for (const mesh of gltf.meshes) {
            //         const meshGameObject = new GameObject(mesh.name);
            //         meshGameObject.transform.SetParent(gameObject.transform);
            //         const meshRenderer = meshGameObject.AddComponent(MeshRenderer);
            //         meshRenderer.mesh = mesh;
            //         meshRenderer.materials = [];
            //         mesh.subMeshes.forEach(function (subMesh) {
            //             if (subMesh.material == 'Glass') meshRenderer.castShadows = false;
            //             if (materials.hasOwnProperty(subMesh.material)) {
            //                 meshRenderer.materials.push(materials[subMesh.material]);
            //             } else {
            //                 const m = gltf.materials.find(function (m) { return m.name == subMesh.material; });

            //                 const material = materials[subMesh.material] = new Material({
            //                     name: subMesh.material,
            //                     shader: litShader,
            //                 });

            //                 Resources.Get(`/Resources/Textures/${material.name}/Albedo.webp`, function (texture) {
            //                     if (texture) material.SetTexture('albedo', texture);
            //                 });

            //                 Resources.Get(`/Resources/Textures/${material.name}/Normal.webp`, function (texture) {
            //                     if (texture) material.SetTexture('normal', texture);
            //                 });

            //                 Resources.Get(`/Resources/Textures/${material.name}/Roughness.webp`, function (texture) {
            //                     if (texture) material.SetTexture('roughness', texture);
            //                 });

            //                 Resources.Get(`/Resources/Textures/${material.name}/Metallic.webp`, function (texture) {
            //                     if (texture) material.SetTexture('metallic', texture);
            //                 });

            //                 Resources.Get(`/Resources/Textures/${material.name}/Occlusion.webp`, function (texture) {
            //                     if (texture) material.SetTexture('occlussion', texture);
            //                 });

            //                 material.Update();

            //                 if (m && m.pbrMetallicRoughness) {
            //                     const pbr = m.pbrMetallicRoughness;
            //                     if (pbr.baseColorFactor) {
            //                         const color = pbr.baseColorFactor;
            //                         material.color.Set(color[0], color[1], color[2], color[3]);
            //                     }

            //                     material.metallic = pbr.metallicFactor ?? 0;
            //                     material.roughness = pbr.roughnessFactor ?? 0;
            //                 }

            //                 meshRenderer.materials.push(material);
            //             }
            //         });

            //         const meshCollider = meshGameObject.AddComponent(MeshCollider);
            //     }
            // });

        }, function (index, total, path) {
            console.log(`${index}/${total} - ${path}`);
        });
    });
});