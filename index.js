function loadBitmap(src, callback) {
    const image = new Image();
    image.src = src;
    image.onload = async function (event) {
        const bitmap = await createImageBitmap(image);
        callback(bitmap, image);
    };
}

window.addEventListener('load', async function (event) {
    // console.clear();

    let device = await GPU.Request();
    if (!device) return alert('need a browser that supports WebGPU');

    Ajax.Get('/assets.php', function (response) {
        const assets = window.assets = JSON.parse(response);

        const engine = new Engine(assets);
        engine.Init(function (engine) {
            const unlitShader = new Shader(assets.shaders['Unlit.wgsl']);
            unlitShader.Compile();

            const whiteMaterial = new Material({
                name: 'White',
                shader: unlitShader,
            });
            const blackMaterial = new Material({
                name: 'Black',
                shader: unlitShader,
                color: Color.black,
            });
            const goldMaterial = new Material({
                name: 'Gold',
                shader: unlitShader,
                color: new Color(1, 0.5, 0, 1),
            });
            const beigeMaterial = new Material({
                name: 'Beige',
                shader: unlitShader,
                color: new Color(223 / 255, 212 / 255, 200 / 255, 1),
            });
            const oliveMaterial = new Material({
                name: 'Olive',
                shader: unlitShader,
                color: new Color(167 / 255, 169 / 255, 148 / 255, 1),
            });

            const concreteMaterial = new Material({
                name: 'Concrete',
                shader: unlitShader,
            });
            const floorMaterial = new Material({
                name: 'Floor',
                shader: unlitShader,
            });
            const u702pmst9Material = new Material({
                name: 'U702PMST9',
                shader: unlitShader,
            });
            const u702st9Material = new Material({
                name: 'U702ST9',
                shader: unlitShader,
            });

            const sonomaMaterial = new Material({
                name: 'Sonoma',
                shader: unlitShader,
            });
            const unlit2Material = new Material({
                name: 'Unlit2',
                shader: unlitShader,
            });

            loadBitmap('/Assets/Images/hungarian-point-flooring-unity/hungarian-point-flooring_albedo.png', function (albedo) {
                loadBitmap('/Assets/Images/hungarian-point-flooring-unity/hungarian-point-flooring_normal.png', function (normal) {
                    loadBitmap('/Assets/Images/hungarian-point-flooring-unity/hungarian-point-flooring_ao.png', function (ambientOcclusion) {
                        floorMaterial.albedo = albedo;
                        floorMaterial.normal = normal;
                        floorMaterial.ambientOcclusion = ambientOcclusion;
                        floorMaterial.Update();
                    });
                });
            });

            loadBitmap('/Assets/Images/U702 PMST9.jpg', function (bitmap) {
                u702pmst9Material.albedo = bitmap;
                u702pmst9Material.Update();
            });

            loadBitmap('/Assets/Images/D1038 BS BETON MILLENIUM.jpg', function (bitmap) {
                concreteMaterial.albedo = bitmap;
                concreteMaterial.Update();
            });

            loadBitmap('/Assets/Images/D3025 OW DAB SONOMA.jpg', function (bitmap) {
                sonomaMaterial.albedo = bitmap;
                sonomaMaterial.Update();
            });

            loadBitmap('/Assets/Images/D4428_OV_Dąb_naturalny.jpg', function (bitmap) {
                unlit2Material.albedo = bitmap;
                unlit2Material.Update();
            });

            const materials = {
                Glass: null,

                Light: goldMaterial,
                Plastic: whiteMaterial,
                White: whiteMaterial,
                Beige: beigeMaterial,
                Gold: goldMaterial,
                Black: blackMaterial,

                Concrete: concreteMaterial,
                Floor: floorMaterial,
                Tiles: floorMaterial,
                Walnut: sonomaMaterial,
                Wardrobe: sonomaMaterial,
                'H1386-ST40': sonomaMaterial,
                'U702-PM': u702pmst9Material,
                'U702-ST9': u702pmst9Material,

                Bedroom_S: oliveMaterial,
                Bedroom_E: oliveMaterial,
                Bedroom_N: oliveMaterial,
                Bedroom_W: oliveMaterial,

                Wall_S: oliveMaterial,
                Wall_E: oliveMaterial,
                Wall_N: oliveMaterial,
                Wall_W: oliveMaterial,

                Wall_K_S: oliveMaterial,
                Wall_K_S_2: oliveMaterial,
                Wall_K_S_3: oliveMaterial,
                Wall_K_S_4: oliveMaterial,
                Wall_K_W: oliveMaterial,
                Wall_K: oliveMaterial,
                Wall_K_2: oliveMaterial,
            };

            const ambientLight = engine.scene.AddComponent(AmbientLight);
            ambientLight.color.Set(0.95, 0.975, 1, 1);

            const directionalLightGameObject = new GameObject('DirectionalLight');
            directionalLightGameObject.transform.rotation = Quaternion.FromEuler(-75, 0, 0);
            directionalLightGameObject.transform.position = directionalLightGameObject.transform.back.Multiply(5);
            const directionalLight = directionalLightGameObject.AddComponent(DirectionalLight);

            const cameraGameObject = new GameObject('Camera');
            cameraGameObject.transform.position = new Vector3(-1, 1, 5);
            cameraGameObject.AddComponent(Camera);
            cameraGameObject.AddComponent(Test);

            Importer.GLTF('/Assets/Models', 'Krakow.gltf', function (meshes, gltfMaterials) {
                for (const mesh of meshes) {
                    const gameObject = new GameObject(mesh.name);
                    gameObject.transform.position = new Vector3(0, 0, -5);
                    const meshRenderer = gameObject.AddComponent(MeshRenderer);
                    meshRenderer.mesh = mesh;

                    meshRenderer.materials = [];
                    mesh.subMeshes.forEach(function (subMesh) {
                        if (materials.hasOwnProperty(subMesh.material)) {
                            meshRenderer.materials.push(materials[subMesh.material]);
                        } else {
                            meshRenderer.materials.push(whiteMaterial);
                            console.log(subMesh.material);
                        }
                    });
                }
            });
        });
    });
});