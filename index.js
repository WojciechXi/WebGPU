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

    window.meshes = {};

    await Importer.GLTF('/Assets/Models', 'Cube.gltf', function (meshes, gltfMaterials) {
        for (const mesh of meshes) window.meshes.cube = mesh;
    });

    // Importer.GLTF('/Assets/Models', 'Sphere.gltf', function (meshes, gltfMaterials) {
    //     for (const mesh of meshes) window.meshes.sphere = mesh;
    // });

    await Importer.GLTF('/Assets/Models', 'Icosphere.gltf', function (meshes, gltfMaterials) {
        for (const mesh of meshes) window.meshes.sphere = mesh;
    });

    await Importer.GLTF('/Assets/Models', 'Capsule.gltf', function (meshes, gltfMaterials) {
        for (const mesh of meshes) window.meshes.capsule = mesh;
    });

    Ajax.Get('/assets.php', function (response) {
        const assets = window.assets = JSON.parse(response);

        const engine = new Engine(assets);
        engine.Init(function (engine) {
            const litShader = new Shader(assets.shaders['Lit.wgsl']);
            litShader.Compile();

            const foliageShader = new Shader(assets.shaders['Foliage.wgsl']);
            foliageShader.Compile();

            const grassMaterial = new Material({
                name: 'White',
                shader: foliageShader,
            });
            loadBitmap('/Assets/Images/Grass.png', function (albedo) {
                grassMaterial.SetTexture('albedo', albedo);
                grassMaterial.Update();
            });

            const whiteMaterial = new Material({
                name: 'White',
                shader: litShader,
            });
            const blackMaterial = new Material({
                name: 'Black',
                shader: litShader,
                color: Color.black,
            });
            const goldMaterial = new Material({
                name: 'Gold',
                shader: litShader,
                color: new Color(1, 0.5, 0, 1),
            });
            const beigeMaterial = new Material({
                name: 'Beige',
                shader: litShader,
                color: new Color(223 / 255, 212 / 255, 200 / 255, 1),
            });

            const concreteMaterial = new Material({
                name: 'Concrete',
                shader: litShader,
            });
            const u702pmst9Material = new Material({
                name: 'U702PMST9',
                shader: litShader,
            });
            const u702st9Material = new Material({
                name: 'U702ST9',
                shader: litShader,
            });

            const sonomaMaterial = new Material({
                name: 'Sonoma',
                shader: litShader,
            });
            loadBitmap('/Assets/Images/D3025 OW DAB SONOMA/Albedo.jpg', function (albedo) {
                loadBitmap('/Assets/Images/D3025 OW DAB SONOMA/NormalMap.png', function (normal) {
                    loadBitmap('/Assets/Images/D3025 OW DAB SONOMA/SpecularMap.png', function (metallic) {
                        loadBitmap('/Assets/Images/D3025 OW DAB SONOMA/AmbientOcclusionMap.png', function (occlusion) {
                            sonomaMaterial.SetTexture('albedo', albedo);
                            sonomaMaterial.SetTexture('normal', normal);
                            sonomaMaterial.SetTexture('metallic', metallic);
                            sonomaMaterial.SetTexture('occlusion', occlusion);
                            sonomaMaterial.Update();
                        });
                    });
                });
            });

            const unlit2Material = new Material({
                name: 'Lit2',
                shader: litShader,
            });

            const whitePaintMaterial = new Material({
                name: 'Wall paint',
                shader: litShader,
            });

            const olivePaintMaterial = new Material({
                name: 'Wall paint',
                shader: litShader,
                color: new Color(167 / 255, 169 / 255, 148 / 255, 1),
            });

            loadBitmap('/Assets/Images/Poliigon_PlasterPainted_7664/Poliigon_PlasterPainted_7664_BaseColor.jpg', function (albedo) {
                loadBitmap('/Assets/Images/Poliigon_PlasterPainted_7664/Poliigon_PlasterPainted_7664_Normal.png', function (normal) {
                    loadBitmap('/Assets/Images/Poliigon_PlasterPainted_7664/Poliigon_PlasterPainted_7664_Roughness.jpg', function (roughness) {
                        loadBitmap('/Assets/Images/Poliigon_PlasterPainted_7664/Poliigon_PlasterPainted_7664_Metallic.jpg', function (metallic) {
                            whitePaintMaterial.SetTexture('albedo', albedo);
                            // whitePaintMaterial.SetTexture('normal', normal);
                            whitePaintMaterial.SetTexture('roughness', roughness);
                            whitePaintMaterial.SetTexture('metallic', metallic);
                            whitePaintMaterial.Update();

                            olivePaintMaterial.SetTexture('albedo', albedo);
                            // olivePaintMaterial.SetTexture('normal', normal);
                            olivePaintMaterial.SetTexture('roughness', roughness);
                            olivePaintMaterial.SetTexture('metallic', metallic);
                            olivePaintMaterial.Update();
                        });
                    });
                });
            });

            const floorMaterial = new Material({
                name: 'Floor',
                shader: litShader,
            });
            loadBitmap('/Assets/Images/hungarian-point-flooring-unity/hungarian-point-flooring_albedo.png', function (albedo) {
                loadBitmap('/Assets/Images/hungarian-point-flooring-unity/hungarian-point-flooring_normal.png', function (normal) {
                    loadBitmap('/Assets/Images/hungarian-point-flooring-unity/hungarian-point-flooring_ao.png', function (occlusion) {
                        floorMaterial.SetTexture('albedo', albedo);
                        floorMaterial.SetTexture('normal', normal);
                        floorMaterial.SetTexture('occlusion', occlusion);
                        floorMaterial.Update();
                    });
                });
            });

            const terrainMaterial = new Material({
                name: 'Terrain',
                shader: litShader,
            });
            loadBitmap('/Assets/Images/Grass004_1K-JPG/Grass004_1K-JPG_Color.jpg', function (albedo) {
                loadBitmap('/Assets/Images/Grass004_1K-JPG/Grass004_1K-JPG_Normal.jpg', function (normal) {
                    loadBitmap('/Assets/Images/Grass004_1K-JPG/Grass004_1K-JPG_AmbientOcclusion.jpg', function (occlusion) {
                        loadBitmap('/Assets/Images/Grass004_1K-JPG/Grass004_1K-JPG_Roughness.jpg', function (roughness) {
                            terrainMaterial.SetTexture('albedo', albedo);
                            terrainMaterial.SetTexture('normal', normal);
                            terrainMaterial.SetTexture('occlusion', occlusion);
                            terrainMaterial.SetTexture('roughness', roughness);
                            terrainMaterial.Update();
                        });
                    });
                });
            });

            const stackOfBricksMaterial = new Material({
                name: 'Stack of bricks',
                shader: litShader,
            });
            loadBitmap('/Assets/Images/Stack of Bricks/Albedo.jpg', function (albedo) {
                loadBitmap('/Assets/Images/Stack of Bricks/Normal.jpg', function (normal) {
                    loadBitmap('/Assets/Images/Stack of Bricks/Occlusion.jpg', function (ambientOcclusion) {
                        stackOfBricksMaterial.albedo = albedo;
                        stackOfBricksMaterial.normal = normal;
                        stackOfBricksMaterial.ambientOcclusion = ambientOcclusion;
                        stackOfBricksMaterial.Update();
                    });
                });
            });

            const pbrShpereMaterial = new Material({
                name: 'PBR',
                shader: litShader,
            });
            loadBitmap('/Assets/Images/pbr_sphere/sphere_Base_Color.png', function (albedo) {
                loadBitmap('/Assets/Images/pbr_sphere/sphere_Normal.png', function (normal) {
                    loadBitmap('/Assets/Images/pbr_sphere/sphere_Roughness.png', function (roughness) {
                        loadBitmap('/Assets/Images/pbr_sphere/sphere_Metallic.png', function (metallic) {
                            loadBitmap('/Assets/Images/pbr_sphere/sphere_Mixed_AO.png', function (occlusion) {
                                pbrShpereMaterial.SetTexture('albedo', albedo);
                                pbrShpereMaterial.SetTexture('normal', albedo);
                                pbrShpereMaterial.SetTexture('roughness', roughness);
                                pbrShpereMaterial.SetTexture('metallic', metallic);
                                pbrShpereMaterial.SetTexture('occlusion', occlusion);
                                pbrShpereMaterial.Update();
                            });
                        });
                    });
                });
            });

            loadBitmap('/Assets/Images/U702 PMST9.jpg', function (albedo) {
                u702pmst9Material.SetTexture('albedo', albedo);
                u702pmst9Material.Update();
            });

            loadBitmap('/Assets/Images/D1038 BS BETON MILLENIUM.jpg', function (albedo) {
                concreteMaterial.SetTexture('albedo', albedo);
                concreteMaterial.Update();
            });

            loadBitmap('/Assets/Images/D4428_OV_Dąb_naturalny.jpg', function (albedo) {
                unlit2Material.SetTexture('albedo', albedo);
                unlit2Material.Update();
            });

            const materials = {
                Glass: null,
                Grass: grassMaterial,
                'sphere.001': pbrShpereMaterial,
                'Stack of Bricks': stackOfBricksMaterial,

                Light: goldMaterial,
                Plastic: whiteMaterial,

                White: whitePaintMaterial,
                Ceil: whitePaintMaterial,
                Wall: whitePaintMaterial,
                Elevation: whitePaintMaterial,

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

                'Bedroom S': olivePaintMaterial,
                'Bedroom E': olivePaintMaterial,
                'Bedroom N': olivePaintMaterial,
                'Bedroom W': olivePaintMaterial,

                'Wall S': olivePaintMaterial,
                'Wall E': olivePaintMaterial,
                'Wall N': olivePaintMaterial,
                'Wall W': olivePaintMaterial,

                'Wall K S': olivePaintMaterial,
                'Wall K S 2': olivePaintMaterial,
                'Wall K S 3': olivePaintMaterial,
                'Wall K S 4': olivePaintMaterial,
                'Wall K W': olivePaintMaterial,
                'Wall K': olivePaintMaterial,
                'Wall K 2': olivePaintMaterial,
            };

            const ambientLight = engine.scene.AddComponent(AmbientLight);
            ambientLight.color.Set(0.5, 0.75, 1, 0.2);

            const directionalLightGameObject = new GameObject('DirectionalLight');
            directionalLightGameObject.transform.rotation = Quaternion.FromEuler(30, 0, 0);
            directionalLightGameObject.transform.position = Vector3.Multiply(directionalLightGameObject.transform.back, 25);
            const directionalLight = directionalLightGameObject.AddComponent(DirectionalLight);

            const cameraGameObject = new GameObject('Camera');
            cameraGameObject.transform.position = new Vector3(0, 1, -10);
            cameraGameObject.AddComponent(Camera);
            cameraGameObject.AddComponent(Test);

            // const terrainGameObject = new GameObject('Terrain');
            // terrainGameObject.transform.position = new Vector3(-50, 0, -50);
            // let terrain = terrainGameObject.AddComponent(Terrain);
            // let terrainCollider = terrainGameObject.AddComponent(TerrainCollider);
            // terrain.material = terrainMaterial;

            // const perlinNoise = new PerlinNoise();
            // const heights = [];
            // for (let x = 0; x < terrain.resolution; x++) {
            //     for (let z = 0; z < terrain.resolution; z++) {
            //         const noise = perlinNoise.NoiseOctave(x * 0.0123, z * 0.0123, 8);
            //         heights.push(noise);
            //     }
            // }
            // terrain.SetHeights(0, 0, terrain.resolution, terrain.resolution, heights);

            setTimeout(function () {
                Physics.simulate = true;
            }, 1000);

            // let go = new GameObject('Voxel Chunk');
            // let meshRenderer = go.AddComponent(MeshRenderer);
            // meshRenderer.materials = [goldMaterial];
            // let voxelChunk = go.AddComponent(VoxelChunk);
            // voxelChunk.Generate();
            // voxelChunk.BuildMesh();

            Importer.GLTF('/Assets/Models', 'Krakow.gltf', function (meshes, gltfMaterials) {
                const gameObject = new GameObject('Krakow');
                gameObject.transform.position = new Vector3(0, 0, 0);
                gameObject.transform.rotation = Quaternion.FromEuler(0, 0, 0);

                for (const mesh of meshes) {
                    const meshGameObject = new GameObject(mesh.name);
                    meshGameObject.transform.SetParent(gameObject.transform);
                    const meshRenderer = meshGameObject.AddComponent(MeshRenderer);

                    meshRenderer.mesh = mesh;
                    meshRenderer.materials = [];
                    mesh.subMeshes.forEach(function (subMesh) {
                        if (materials.hasOwnProperty(subMesh.material)) {
                            meshRenderer.materials.push(materials[subMesh.material]);
                        } else {
                            console.log(subMesh.material);
                            meshRenderer.materials.push(whiteMaterial);
                        }
                    });
                }
            });
        });
    });
});