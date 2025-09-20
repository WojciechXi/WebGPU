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

                let vertex = new Vector3(x, y, z);

                vertices.push(vertex);
            } else if (line.startsWith('vn ')) {
                line = line.split(' ');
                let x = parseFloat(line[1]);
                let y = parseFloat(line[2]);
                let z = parseFloat(line[3]);

                let normal = new Vector3(x, y, z);

                normals.push(normal);
            } else if (line.startsWith('vt ')) {
                line = line.split(' ');
                let x = parseFloat(line[1]);
                let y = parseFloat(line[2]);

                let uv = new Vector2(x, y);

                uvs.push(uv);
            }
        }

        let mesh = new Mesh();
        mesh.vertices = vertices;
        mesh.normals = normals;
        mesh.uvs = uvs;

        for (let line of lines) {
            if (line.startsWith('f ')) {
                line = line.split(' ');
                for (let l of line) {
                    if (l == 'f') continue;
                    l = l.split('/');

                    let vertexIndex = parseInt(l[0]) - 1;
                    let uvIndex = parseInt(l[1]) - 1;
                    let normalIndex = parseInt(l[2]) - 1;

                    mesh.triangles.push(vertexIndex);
                }
            }
        }

        console.log(lines);
        console.log(mesh);

        mesh.Update();

        callback(mesh);
    }

}