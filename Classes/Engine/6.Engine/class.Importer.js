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

                    mesh.vertices.push(vertices[vertexIndex]);
                    mesh.triangles.push(mesh.vertices.length - 1);
                    if (uvs[uvIndex]) mesh.uvs.push(uvs[uvIndex]);
                    if (normals[normalIndex]) mesh.normals.push(normals[normalIndex]);
                }
            }
        }

        if (mesh) {
            mesh.Update();
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

                mesh.vertices = vertices;
                mesh.normals = normals;
                mesh.tangents = tangents;
                mesh.uvs = uvs;

                let materialName = primitive.material !== undefined && gltf.materials
                    ? gltf.materials[primitive.material]?.name || "default"
                    : "default";

                let subMesh = new SubMesh({
                    triangles: _indices || [],
                    material: materialName,
                });

                mesh.subMeshes.push(subMesh);

                mesh.RecalculateNormals?.();
                mesh.RecalculateTangents?.();
                mesh.RecalculateBounds?.();
                mesh.Update?.();

                meshes.push(mesh);
            });
        });

        if (callback) callback(meshes, gltf.materials);
    }

}
