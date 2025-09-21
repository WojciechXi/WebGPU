function loadBitmap(src, callback) {
    const image = new Image();
    image.src = src;
    image.onload = async function (event) {
        const bitmap = await createImageBitmap(image);
        callback(bitmap, image);
    };
}

window.addEventListener('load', function (event) {
    const engine = new Engine();
    engine.Init(function (engine) {
        Ajax.Get('/assets.php', function (response) {
            response = JSON.parse(response);
            const skyboxShader = new Shader(response.shaders['Skybox.wgsl'], null, {
                cullMode: 'none',
                depthWriteEnabled: false,
                depthCompare: 'always',
            });

            skyboxShader.Compile();
            const skyboxMaterial = new Material(skyboxShader);
            skyboxMaterial.color.Set(0.95, 0.975, 1, 1);

            const unlitShader = new Shader(response.shaders['Unlit.wgsl'], [
                {
                    arrayStride: (3 + 3 + 3 + 2) * 4, // position + normal + color + uv
                    attributes: [
                        { shaderLocation: 0, offset: 0, format: 'float32x3' },       // position
                        { shaderLocation: 1, offset: 3 * 4, format: 'float32x3' },   // normal
                        { shaderLocation: 2, offset: 6 * 4, format: 'float32x3' },   // color
                        { shaderLocation: 3, offset: 9 * 4, format: 'float32x2' },   // uv
                    ],
                }
            ], {
                cullMode: 'none',
            });
            unlitShader.Compile();

            const glassShader = new Shader(response.shaders['Glass.wgsl'], [
                {
                    arrayStride: (3 + 3 + 3 + 2) * 4, // position + normal + color + uv
                    attributes: [
                        { shaderLocation: 0, offset: 0, format: 'float32x3' },       // position
                        { shaderLocation: 1, offset: 3 * 4, format: 'float32x3' },   // normal
                        { shaderLocation: 2, offset: 6 * 4, format: 'float32x3' },   // color
                        { shaderLocation: 3, offset: 9 * 4, format: 'float32x2' },   // uv
                    ],
                }
            ], {
                cullMode: 'none',
                depthWriteEnabled: false,
                depthCompare: 'less',
                blend: {
                    color: {
                        srcFactor: 'src-alpha',
                        dstFactor: 'one-minus-src-alpha',
                        operation: 'add',
                    },
                    alpha: {
                        srcFactor: 'one',
                        dstFactor: 'one-minus-src-alpha',
                        operation: 'add',
                    },
                },
            });
            glassShader.Compile();

            const unlitMaterial = new Material(unlitShader);
            const unlit2Material = new Material(unlitShader);
            const glassMaterial = new Material(glassShader);
            glassMaterial.color.a = 0.5;

            loadBitmap('/Assets/Images/D3025 OW DAB SONOMA.jpg', function (bitmap) {
                unlitMaterial.diffuse = bitmap;

                loadBitmap('/Assets/Images/D4428_OV_Dąb_naturalny.jpg', function (bitmap) {
                    unlit2Material.diffuse = bitmap;
                });
            });

            const materials = {
                Glass: glassMaterial,
                Wardrobe: unlit2Material,
            };

            const skybox = engine.scene.AddComponent(Skybox);
            skybox.material = skyboxMaterial;

            const ambientLight = engine.scene.AddComponent(AmbientLight);
            ambientLight.color.Set(0.95, 0.975, 1, 0.6);

            const directionalLightGameObject = new GameObject('DirectionalLight');
            directionalLightGameObject.transform.eulerAngles = new Vector3(-45, 0, 0);
            const directionalLight = directionalLightGameObject.AddComponent(DirectionalLight);

            const cameraGameObject = new GameObject('Camera');
            cameraGameObject.transform.position = new Vector3(0, 1, 5);
            cameraGameObject.AddComponent(Camera);
            cameraGameObject.AddComponent(Test);

            const terrainGameObject = new GameObject('Terrain');
            const terrain = terrainGameObject.AddComponent(Terrain);
            terrain.material = unlitMaterial;

            Ajax.Get('/Assets/Models/Odlegla.obj', function (obj) {
                Importer.Obj(obj, function (meshes) {
                    let i = 0;
                    for (const mesh of meshes) {
                        const cubeGameObject = new GameObject('Cube');
                        const meshRenderer = cubeGameObject.AddComponent(MeshRenderer);
                        meshRenderer.material = materials[mesh.name] ?? unlitMaterial;
                        meshRenderer.mesh = mesh;
                    }
                });
            });
        });
    });
});