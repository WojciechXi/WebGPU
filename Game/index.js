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

            engine.defaultMaterial = materials.Default = new Material({
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
            engine.scene.ambientLight = ambientLight;
            ambientLight.color.Set(0.8, 0.9, 1, 0.25);

            const directionalLightGameObject = new GameObject('Directional Light');
            const directionalLight = directionalLightGameObject.AddComponent(DirectionalLight);
            engine.scene.directionalLight = directionalLight;
            directionalLight.color.Set(1, 1, 1, 0.75);
            const test2 = directionalLightGameObject.AddComponent(Test2);
            directionalLightGameObject.transform.position = Vector3.Multiply(directionalLightGameObject.transform.back, 25);
            test2.turn.x = 30;

            const testCameraGameObject = new GameObject('Test Camera');
            testCameraGameObject.transform.position = new Vector3(0, 1, -5);
            const testCamera = testCameraGameObject.AddComponent(Camera);
            const test = testCameraGameObject.AddComponent(Test);

            const cameraGameObject = new GameObject('Camera');
            cameraGameObject.transform.position = new Vector3(-1, 1, -5);
            const camera = cameraGameObject.AddComponent(Camera);
            camera.rect.x = 0.75;
            camera.rect.y = 0.75;
            camera.rect.width = 0.25;
            camera.rect.height = 0.25;

            const planeGameObject = new GameObject("Plane");
            const planeMeshRenderer = planeGameObject.AddComponent(MeshRenderer);
            const planeBoxCollider = planeGameObject.AddComponent(BoxCollider);
            planeGameObject.transform.localScale = new Vector3(10, 1, 10);
            planeMeshRenderer.material = materials.Default;
            planeMeshRenderer.mesh = Graphics.cubeMesh;

            const sphereGameObject = new GameObject("Sphere");
            sphereGameObject.transform.position = new Vector3(0, 2, 0);
            const sphereMeshRenderer = sphereGameObject.AddComponent(MeshRenderer);
            const sphereSphereCollider = sphereGameObject.AddComponent(SphereCollider);
            const sphereRigidbody = sphereGameObject.AddComponent(Rigidbody);
            sphereMeshRenderer.material = materials.Default;
            sphereMeshRenderer.mesh = Graphics.sphereMesh;

            const cubeGameObject = new GameObject("Cube");
            cubeGameObject.transform.position = new Vector3(2, 2, 0);
            const cubeMeshRenderer = cubeGameObject.AddComponent(MeshRenderer);
            const cubeBoxCollider = cubeGameObject.AddComponent(BoxCollider);
            const cubeRigidbody = cubeGameObject.AddComponent(Rigidbody);
            cubeMeshRenderer.material = materials.Default;
            cubeMeshRenderer.mesh = Graphics.cubeMesh;

            const capsuleGameObject = new GameObject("Capsule");
            capsuleGameObject.transform.position = new Vector3(-2, 2, 0);
            const capsuleMeshRenderer = capsuleGameObject.AddComponent(MeshRenderer);
            const capsuleCapsuleCollider = capsuleGameObject.AddComponent(CapsuleCollider);
            const capsuleRigidbody = capsuleGameObject.AddComponent(Rigidbody);
            capsuleMeshRenderer.material = materials.Default;
            capsuleMeshRenderer.mesh = Graphics.cubeMesh;

            Resources.Get('/Resources/Models/Human.glb', function (gltf) {
                const gameObject = GameObject.Instantiate(gltf.rootGameObject, Vector3.up);
                console.log(gameObject);
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