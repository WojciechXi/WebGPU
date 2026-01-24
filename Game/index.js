window.addEventListener('DOMContentLoaded', async function (event) {
    const device = await GPU.Request();
    const engine = new Engine();

    engine.Init(function (engine) {
        Resources.Init(function () {
            engine.Awake();

            const litShader = new Shader(Resources.Get('/Resources/Shaders/Lit.wgsl'));
            litShader.Compile();

            const whiteMaterial = new Material({
                name: 'White',
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

            Resources.Get('/Resources/Models/Ablewicza 15.gltf', function (gltf) {
                const gameObject = new GameObject('Ablewicza 15');

                for (const mesh of gltf.meshes) {
                    const meshGameObject = new GameObject(mesh.name);
                    meshGameObject.transform.SetParent(gameObject.transform);
                    const meshRenderer = meshGameObject.AddComponent(MeshRenderer);

                    meshRenderer.mesh = mesh;
                    meshRenderer.materials = [];
                    mesh.subMeshes.forEach(function (subMesh) {
                        if (gltf.materials.hasOwnProperty(subMesh.material)) {
                            meshRenderer.materials.push(materials[subMesh.material]);
                        } else {
                            meshRenderer.materials.push(whiteMaterial);
                        }
                    });
                }
            })
        }, function (index, total, path) {
            console.log(`${index}/${total} - ${path}`);
        });
    });
});