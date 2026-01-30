class Importer {

    static Obj(obj, callback) {
        let lines = obj.split("\n");

        let vertices = [];
        let normals = [];
        let uvs = [];

        for (let line of lines) {
            if (line.startsWith('v ')) {
                line = line.split(' ');
                let x = parseFloat(line[1]);
                let y = parseFloat(line[2]);
                let z = parseFloat(line[3]);
                vertices.push(new Vector3(x, y, z));
            } else if (line.startsWith('vn ')) {
                line = line.split(' ');
                let x = parseFloat(line[1]);
                let y = parseFloat(line[2]);
                let z = parseFloat(line[3]);
                normals.push(new Vector3(x, y, z));
            } else if (line.startsWith('vt ')) {
                line = line.split(' ');
                let x = parseFloat(line[1]);
                let y = parseFloat(line[2]);
                uvs.push(new Vector2(x, y));
            }
        }

        let meshes = [];
        let mesh = null;
        const meshVertices = [];
        const meshNormals = [];
        const meshUVs = [];
        const subMeshTriangles = [];

        for (let line of lines) {
            if (line.startsWith('usemtl')) {
                if (mesh) {
                    mesh.Update();
                    meshes.push(mesh);
                }
                mesh = new Mesh((line.split(' ')[1]).trim());
            } else if (line.startsWith('f ')) {
                line = line.split(' ');
                for (let l of line) {
                    if (l === 'f') continue;
                    l = l.split('/');

                    let vertexIndex = parseInt(l[0]) - 1;
                    let uvIndex = parseInt(l[1]) - 1;
                    let normalIndex = parseInt(l[2]) - 1;

                    meshVertices.push(vertices[vertexIndex]);
                    if (normals[normalIndex]) meshNormals.push(normals[normalIndex]);
                    if (uvs[uvIndex]) meshUVs.push(uvs[uvIndex]);
                    subMeshTriangles.push(meshVertices.length - 1);
                }
            }
        }

        if (mesh) {
            mesh.SetVertices(vertices);
            mesh.SetNormals(normals);
            mesh.SetUVs(uvs);
            mesh.SetSubMeshes([
                new SubMesh({
                    triangles: subMeshTriangles,
                }),
            ]);
            mesh.UploadMeshData();
            meshes.push(mesh);
        }

        callback(meshes);
    }

    static async GLTF(path, file, callback) {
        // 1. Pobieramy plik JSON glTF
        const res = await fetch(`${path}/${file}`);
        const gltf = await res.json();

        // 2. Wczytujemy plik binarny
        const bufferUri = gltf.buffers[0].uri;
        const bufferRes = await fetch(`${path}/${bufferUri}`);
        const arrayBuffer = await bufferRes.arrayBuffer();
        const intArrayBuffer = [new Uint8Array(arrayBuffer)];

        // Pomocnicza funkcja liczby komponentów
        function numComponents(type) {
            switch (type) {
                case 'SCALAR': return 1;
                case 'VEC2': return 2;
                case 'VEC3': return 3;
                case 'VEC4': return 4;
                case 'MAT4': return 16;
                default: throw new Error('Nieobsługiwany typ: ' + type);
            }
        }

        // 3. Funkcja do odczytu danych według accessorów
        function getAccessorData(gltf, accessorIndex) {
            const accessor = gltf.accessors[accessorIndex];
            if (!accessor) return null;

            const bufferView = gltf.bufferViews[accessor.bufferView];
            if (!bufferView) return null;

            const buffer = intArrayBuffer[bufferView.buffer];
            const byteOffset = (bufferView.byteOffset || 0) + (accessor.byteOffset || 0);
            const length = accessor.count;
            const nComponents = numComponents(accessor.type);

            let TypedArray;
            switch (accessor.componentType) {
                case 5123: TypedArray = Uint16Array; break;
                case 5125: TypedArray = Uint32Array; break;
                case 5126: TypedArray = Float32Array; break;
                default: throw new Error("Unsupported componentType: " + accessor.componentType);
            }

            return new TypedArray(
                buffer.buffer,
                buffer.byteOffset + byteOffset,
                length * nComponents
            );
        }

        // Bezpieczne wywołanie accessorów
        function safeGetAccessorData(gltf, accessorIndex) {
            if (accessorIndex === undefined) return null;
            return getAccessorData(gltf, accessorIndex);
        }

        // 4. Tworzymy meshe
        let meshes = [];
        gltf.meshes.forEach((_mesh) => {
            _mesh.primitives.forEach((primitive) => {
                let mesh = new Mesh(_mesh.name);

                const _positions = safeGetAccessorData(gltf, primitive.attributes.POSITION);
                const _normals = safeGetAccessorData(gltf, primitive.attributes.NORMAL);
                const _tangents = safeGetAccessorData(gltf, primitive.attributes.TANGENT);
                const _uvs = safeGetAccessorData(gltf, primitive.attributes.TEXCOORD_0);
                const _indices = safeGetAccessorData(gltf, primitive.indices);

                let vertices = [];
                let normals = [];
                let tangents = [];
                let uvs = [];

                if (_positions) {
                    for (let i = 0; i < _positions.length; i += 3)
                        vertices.push(new Vector3(-_positions[i], _positions[i + 1], _positions[i + 2]));
                }

                if (_normals) {
                    for (let i = 0; i < _normals.length; i += 3)
                        normals.push(new Vector3(_normals[i], _normals[i + 1], _normals[i + 2]));
                }

                if (_tangents) {
                    for (let i = 0; i < _tangents.length; i += 4)
                        tangents.push(new Vector4(_tangents[i], _tangents[i + 1], _tangents[i + 2], _tangents[i + 3]));
                }

                if (_uvs) {
                    for (let i = 0; i < _uvs.length; i += 2)
                        uvs.push(new Vector2(_uvs[i], _uvs[i + 1]));
                }

                mesh.SetVertices(vertices);
                mesh.SetNormals(normals);
                mesh.SetTangents(tangents);
                mesh.SetUVs(uvs);

                let materialName = primitive.material !== undefined && gltf.materials
                    ? gltf.materials[primitive.material]?.name || "default"
                    : "default";

                let subMesh = new SubMesh({
                    triangles: _indices || [],
                    material: materialName,
                });

                mesh._subMeshes.push(subMesh);

                // mesh.RecalculateNormals?.();
                // mesh.RecalculateTangents?.();
                // mesh.RecalculateBounds?.();
                mesh.UploadMeshData();

                meshes.push(mesh);
            });
        });

        if (callback) callback(meshes, gltf.materials);
    }

    static async GLB(path, file, callback) {
        const res = await fetch(`${path}/${file}`);
        const arrayBuffer = await res.arrayBuffer();

        // 1. Odczyt nagłówka GLB (12 bajtów)
        const header = new DataView(arrayBuffer, 0, 12);
        const magic = header.getUint32(0, true);
        const version = header.getUint32(4, true);
        const totalLength = header.getUint32(8, true);

        if (magic !== 0x46546C67) { // "glTF" w ASCII
            console.error("To nie jest poprawny plik GLB");
            return;
        }

        // 2. Parsowanie Chunków
        let offset = 12;
        let gltfJson = null;
        let binaryBuffer = null;

        while (offset < totalLength) {
            const chunkHeader = new DataView(arrayBuffer, offset, 8);
            const chunkLength = chunkHeader.getUint32(0, true);
            const chunkType = chunkHeader.getUint32(4, true);
            offset += 8;

            if (chunkType === 0x4E4F534A) { // Typ "JSON"
                const jsonData = new Uint8Array(arrayBuffer, offset, chunkLength);
                const decoder = new TextDecoder("utf-8");
                gltfJson = JSON.parse(decoder.decode(jsonData));
            }
            else if (chunkType === 0x004E4942) { // Typ "BIN"
                binaryBuffer = arrayBuffer.slice(offset, offset + chunkLength);
            }

            offset += chunkLength;
        }

        if (!gltfJson || !binaryBuffer) {
            console.error("Błąd podczas odczytu struktury GLB");
            return;
        }

        // 3. Przekazujemy dane do uniwersalnego parsera
        // Musimy lekko zmodyfikować logikę, aby akceptowała gotowy buffer
        this._parseFromData(gltfJson, binaryBuffer, callback);
    }

    // Pomocnicza metoda, aby nie powtarzać kodu w GLTF i GLB
    static _parseFromData(gltf, arrayBuffer, callback) {
        const intArrayBuffer = new Uint8Array(arrayBuffer);

        // --- POMOCNIKI ---
        function numComponents(type) {
            const mapping = { 'SCALAR': 1, 'VEC2': 2, 'VEC3': 3, 'VEC4': 4, 'MAT4': 16 };
            return mapping[type] || 0;
        }

        function getAccessorData(accessorIndex) {
            if (accessorIndex === undefined || accessorIndex === null) return null;
            const accessor = gltf.accessors[accessorIndex];
            const bufferView = gltf.bufferViews[accessor.bufferView];
            const byteOffset = (bufferView.byteOffset || 0) + (accessor.byteOffset || 0);

            let TypedArray;
            switch (accessor.componentType) {
                case 5121: TypedArray = Uint8Array; break;
                case 5123: TypedArray = Uint16Array; break;
                case 5125: TypedArray = Uint32Array; break;
                case 5126: TypedArray = Float32Array; break;
                default: TypedArray = Float32Array;
            }

            return new TypedArray(
                intArrayBuffer.buffer,
                intArrayBuffer.byteOffset + byteOffset,
                accessor.count * numComponents(accessor.type)
            );
        }

        console.log(gltf);

        // --- NODES (Hierarchia i transformacje) ---
        const gameObjects = gltf.nodes.map((node, index) => {
            const gameObject = new GameObject(node.name || `Node_${index}`);
            if (node.translation) gameObject.transform.position = new Vector3(node.translation[0], node.translation[1], node.translation[2]);
            if (node.rotation) gameObject.transform.rotation = new Quaternion(node.rotation[0], node.rotation[1], node.rotation[2], node.rotation[3]);
            return gameObject;
            return {
                id: index,
                name: node.name || `Node_${index}`,
                children: node.children || [],
                matrix: node.matrix,
                skin: node.skin // Indeks skina, jeśli ten node to mesh ze szkieletem
            };
        });

        // --- 1. TEKSTURY (IMAGES) ---
        const textures = [];
        if (gltf.images) {
            gltf.images.forEach((img) => {
                const bufferView = gltf.bufferViews[img.bufferView];
                const start = bufferView.byteOffset || 0;
                const end = start + bufferView.byteLength;
                const imageData = intArrayBuffer.slice(start, end);
                const blob = new Blob([imageData], { type: img.mimeType });
                const url = URL.createObjectURL(blob);

                // Tutaj możesz utworzyć swój obiekt Texture(url)
                textures.push(url);
            });
        }

        // --- 2. MATERIAŁY ---
        const materials = [];
        if (gltf.materials) {
            gltf.materials.forEach((mat) => {
                const materialData = {
                    name: mat.name,
                    baseColor: mat.pbrMetallicRoughness?.baseColorFactor || [1, 1, 1, 1],
                    // Pobieramy index tekstury, jeśli istnieje
                    diffuseTexture: mat.pbrMetallicRoughness?.baseColorTexture
                        ? textures[gltf.textures[mat.pbrMetallicRoughness.baseColorTexture.index].source]
                        : null
                };
                materials.push(materialData);
            });
        }

        // --- 3. MESHE ---
        let meshes = [];
        if (gltf.meshes) {
            gltf.meshes.forEach((_mesh) => {
                _mesh.primitives.forEach((primitive) => {
                    let mesh = new Mesh(_mesh.name || "GLB_Mesh");

                    // Pozycje
                    const _pos = getAccessorData(primitive.attributes.POSITION);
                    if (_pos) {
                        const v = [];
                        for (let i = 0; i < _pos.length; i += 3) v.push(new Vector3(-_pos[i], _pos[i + 1], _pos[i + 2]));
                        mesh.SetVertices(v);
                    }

                    // UV (Tekstury)
                    const _uvs = getAccessorData(primitive.attributes.TEXCOORD_0);
                    if (_uvs) {
                        const u = [];
                        for (let i = 0; i < _uvs.length; i += 2) u.push(new Vector2(_uvs[i], _uvs[i + 1]));
                        mesh.SetUVs(u);
                    }

                    // Indeksy (Triangles)
                    const triangles = getAccessorData(primitive.indices);
                    mesh.SetSubMeshes([new SubMesh({ triangles: new Uint32Array(triangles) })]);

                    mesh.UploadMeshData();
                    meshes.push({
                        mesh: mesh,
                        materialIndex: primitive.material // Przypisanie indeksu materiału
                    });
                });
            });
        }

        // --- 4. ANIMACJE ---
        const animations = [];
        if (gltf.animations) {
            gltf.animations.forEach(anim => {
                const channels = anim.channels.map(channel => {
                    const sampler = anim.samplers[channel.sampler];
                    return {
                        targetNode: channel.target.node,
                        path: channel.target.path, // "translation", "rotation", "scale"
                        times: getAccessorData(sampler.input),
                        values: getAccessorData(sampler.output)
                    };
                });
                animations.push({ name: anim.name, channels });
            });
        }

        // --- SKINS (Dane szkieletu) ---
        const skins = [];
        if (gltf.skins) {
            gltf.skins.forEach(skin => {
                skins.push({
                    name: skin.name,
                    joints: skin.joints, // Indeksy węzłów (nodes), które są kośćmi
                    // Macierze pomocnicze do obliczeń deformacji
                    inverseBindMatrices: getAccessorData(skin.inverseBindMatrices)
                });
            });
        }

        // const _joints = getAccessorData(primitive.attributes.JOINTS_0);
        // if (_joints) {
        //     const j = [];
        //     // JOINTS_0 to zazwyczaj VEC4 (4 wartości na wierzchołek)
        //     for (let i = 0; i < _joints.length; i += 4) {
        //         j.push([_joints[i], _joints[i + 1], _joints[i + 2], _joints[i + 3]]);
        //     }
        //     mesh.SetBoneIndices(j); // Zakładając, że Twoja klasa Mesh to obsługuje
        // }

        // const _weights = getAccessorData(primitive.attributes.WEIGHTS_0);
        // if (_weights) {
        //     const w = [];
        //     for (let i = 0; i < _weights.length; i += 4) {
        //         w.push([_weights[i], _weights[i + 1], _weights[i + 2], _weights[i + 3]]);
        //     }
        //     mesh.SetBoneWeights(w);
        // }

        // --- FINALNY CALLBACK ---
        if (callback) {
            callback({
                meshes: meshes,
                materials: materials,
                animations: animations,
                textures: textures,
                skins: skins,
                gameObjects: gameObjects,
            });
        }
    }

}
