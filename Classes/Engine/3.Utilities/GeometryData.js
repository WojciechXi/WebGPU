class GeometryData {

    static Cube(min, max) {
        const x0 = min.x, y0 = min.y, z0 = min.z;
        const x1 = max.x, y1 = max.y, z1 = max.z;

        const vertices = [
            new Vector3(x0, y1, z0), new Vector3(x1, y1, z0), new Vector3(x1, y0, z0), new Vector3(x0, y0, z0),
            new Vector3(x1, y1, z1), new Vector3(x0, y1, z1), new Vector3(x0, y0, z1), new Vector3(x1, y0, z1),
            new Vector3(x0, y1, z1), new Vector3(x1, y1, z1), new Vector3(x1, y1, z0), new Vector3(x0, y1, z0),
            new Vector3(x0, y0, z0), new Vector3(x1, y0, z0), new Vector3(x1, y0, z1), new Vector3(x0, y0, z1),
            new Vector3(x0, y1, z1), new Vector3(x0, y1, z0), new Vector3(x0, y0, z0), new Vector3(x0, y0, z1),
            new Vector3(x1, y1, z0), new Vector3(x1, y1, z1), new Vector3(x1, y0, z1), new Vector3(x1, y0, z0),
        ];

        const normals = [
            new Vector3(0, 0, -1), new Vector3(0, 0, -1), new Vector3(0, 0, -1), new Vector3(0, 0, -1),
            new Vector3(0, 0, 1), new Vector3(0, 0, 1), new Vector3(0, 0, 1), new Vector3(0, 0, 1),
            new Vector3(0, 1, 0), new Vector3(0, 1, 0), new Vector3(0, 1, 0), new Vector3(0, 1, 0),
            new Vector3(0, -1, 0), new Vector3(0, -1, 0), new Vector3(0, -1, 0), new Vector3(0, -1, 0),
            new Vector3(-1, 0, 0), new Vector3(-1, 0, 0), new Vector3(-1, 0, 0), new Vector3(-1, 0, 0),
            new Vector3(1, 0, 0), new Vector3(1, 0, 0), new Vector3(1, 0, 0), new Vector3(1, 0, 0),
        ];

        const uvs = [];
        for (let i = 0; i < 6; i++) {
            uvs.push(new Vector2(0, 0), new Vector2(1, 0), new Vector2(1, 1), new Vector2(0, 1));
        }

        const triangles = [];
        for (let i = 0; i < 6; i++) {
            const offset = i * 4;
            triangles.push(
                offset + 0, offset + 1, offset + 2,
                offset + 0, offset + 2, offset + 3
            );
        }

        return { vertices, normals, uvs, triangles };
    }

}