struct Voxel {
    blockId: u32,
    iso: f32,
};

struct Vertex {
    @location(0) position: vec4<f32>,
    @location(1) normal: vec4<f32>,
};

// --- BINDINGI ---
// Zakładam, że binding 1 to Twoje dane wejściowe voxeli
@group(0) @binding(0) var<storage, read> voxelData: array<Voxel>;
@group(0) @binding(1) var<storage, read> triTable: array<i32>;
@group(0) @binding(2) var<storage, read_write> outVertices: array<Vertex>;
@group(0) @binding(3) var<storage, read_write> outIndices: array<u32>;
@group(0) @binding(4) var<storage, read_write> vertexCount: atomic<u32>;

const isoLevel: f32 = 0.5;
const size: u32 = 33u;

fn get_iso(p: vec3<u32>) -> f32 {
    let index = p.x + (p.y * size) + (p.z * size * size);
    return voxelData[index].iso;
}

// Funkcja pomocnicza do pobierania pozycji narożnika kostki
fn get_corner_pos(cornerIndex: u32, gridPos: vec3<u32>) -> vec3<f32> {
    let offsets = array<vec3<f32>, 8>(
        vec3<f32>(0.,0.,0.), vec3<f32>(1.,0.,0.), vec3<f32>(1.,0.,1.), vec3<f32>(0.,0.,1.),
        vec3<f32>(0.,1.,0.), vec3<f32>(1.,1.,0.), vec3<f32>(1.,1.,1.), vec3<f32>(0.,1.,1.)
    );
    return vec3<f32>(gridPos) + offsets[cornerIndex];
}

// Funkcja obliczająca gradient (normalną) w konkretnym punkcie siatki
fn get_voxel_normal(p: vec3<u32>) -> vec3<f32> {
    // Sprawdzamy sąsiadów (z zabezpieczeniem przed wyjściem poza zakres size-1)
    let p_x = min(p.x + 1u, size - 1u);
    let m_x = select(p.x - 1u, 0u, p.x == 0u);
    let p_y = min(p.y + 1u, size - 1u);
    let m_y = select(p.y - 1u, 0u, p.y == 0u);
    let p_z = min(p.z + 1u, size - 1u);
    let m_z = select(p.z - 1u, 0u, p.z == 0u);

    let nx = get_iso(vec3<u32>(p_x, p.y, p.z)) - get_iso(vec3<u32>(m_x, p.y, p.z));
    let ny = get_iso(vec3<u32>(p.x, p_y, p.z)) - get_iso(vec3<u32>(p.x, m_y, p.z));
    let nz = get_iso(vec3<u32>(p.x, p.y, p_z)) - get_iso(vec3<u32>(p.x, p.y, m_z));

    // Normalna to znormalizowany wektor gradientu. 
    // Odwracamy go (minus), ponieważ chcemy, aby normalna wskazywała "na zewnątrz" powierzchni
    return -normalize(vec3<f32>(nx, ny, nz));
}

// Zaktualizowana funkcja interpolująca
fn interpolate_edge(edgeIndex: i32, gridPos: vec3<u32>, corners: array<f32, 8>) -> Vertex {
    var edgeToCorners = array<vec2<u32>, 12>(
        vec2<u32>(0,1), vec2<u32>(1,2), vec2<u32>(2,3), vec2<u32>(3,0),
        vec2<u32>(4,5), vec2<u32>(5,6), vec2<u32>(6,7), vec2<u32>(7,4),
        vec2<u32>(0,4), vec2<u32>(1,5), vec2<u32>(2,6), vec2<u32>(3,7)
    );

    let c1 = edgeToCorners[edgeIndex].x;
    let c2 = edgeToCorners[edgeIndex].y;

    // Pozycje i wartości iso dla narożników krawędzi
    let p1_u = vec3<u32>(get_corner_pos(c1, gridPos));
    let p2_u = vec3<u32>(get_corner_pos(c2, gridPos));
    
    let v1 = corners[c1];
    let v2 = corners[c2];

    // Liniowa interpolacja pozycji
    let t = (isoLevel - v1) / (v2 - v1);
    let pos = vec3<f32>(p1_u) + t * (vec3<f32>(p2_u) - vec3<f32>(p1_u));

    // OBLICZANIE NORMALI:
    // Pobieramy normale w obu narożnikach krawędzi i je interpolujemy
    let n1 = get_voxel_normal(p1_u);
    let n2 = get_voxel_normal(p2_u);
    let normal = normalize(n1 + t * (n2 - n1));

    var v: Vertex;
    v.position = vec4<f32>(pos, 1.0);
    v.normal = vec4<f32>(normal, 0.0); 
    return v;
}

@compute @workgroup_size(8, 4, 4)
fn marching_cubes(@builtin(global_invocation_id) grid: vec3<u32>) {
    if (grid.x >= size - 1u || grid.y >= size - 1u || grid.z >= size - 1u) { return; }

    var corners: array<f32, 8>;
    corners[0] = get_iso(grid + vec3<u32>(0, 0, 0));
    corners[1] = get_iso(grid + vec3<u32>(1, 0, 0));
    corners[2] = get_iso(grid + vec3<u32>(1, 0, 1));
    corners[3] = get_iso(grid + vec3<u32>(0, 0, 1));
    corners[4] = get_iso(grid + vec3<u32>(0, 1, 0));
    corners[5] = get_iso(grid + vec3<u32>(1, 1, 0));
    corners[6] = get_iso(grid + vec3<u32>(1, 1, 1));
    corners[7] = get_iso(grid + vec3<u32>(0, 1, 1));

    var cubeIndex = 0u;
    for (var i = 0u; i < 8u; i++) {
        if (corners[i] < isoLevel) {
            cubeIndex |= (1u << i);
        }
    }

    for (var i = 0; i < 15; i += 3) {
        let e0 = triTable[cubeIndex * 16u + u32(i)];
        if (e0 == -1) { break; }

        let e1 = triTable[cubeIndex * 16u + u32(i + 1)];
        let e2 = triTable[cubeIndex * 16u + u32(i + 2)];

        // Pobieramy indeks startowy dla tych 3 wierzchołków
        let firstVertexIndex = atomicAdd(&vertexCount, 3u);

        // Zapisujemy wierzchołki
        outVertices[firstVertexIndex]     = interpolate_edge(e0, grid, corners);
        outVertices[firstVertexIndex + 1] = interpolate_edge(e1, grid, corners);
        outVertices[firstVertexIndex + 2] = interpolate_edge(e2, grid, corners);

        // ZAPISUJEMY INDEKSY
        outIndices[firstVertexIndex]     = firstVertexIndex;
        outIndices[firstVertexIndex + 1] = firstVertexIndex + 1u;
        outIndices[firstVertexIndex + 2] = firstVertexIndex + 2u;
    }
}