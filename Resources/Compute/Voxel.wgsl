struct Voxel {
    blockId: u32,
    iso: f32,
};

struct Params {
    chunkPos: vec3<f32>,
    seed: f32,
};

@group(0) @binding(0) var<uniform> params: Params;
@group(0) @binding(1) var<storage, read_write> voxelData: array<Voxel>;

const size: u32 = 33u;

// --- FUNKCJE SZUMU (PERLIN 3D) ---

fn mod289_3(x: vec3<f32>) -> vec3<f32> {
    return x - floor(x * (1.0 / 289.0)) * 289.0;
}

fn mod289_4(x: vec4<f32>) -> vec4<f32> {
    return x - floor(x * (1.0 / 289.0)) * 289.0;
}

fn permute(x: vec4<f32>) -> vec4<f32> {
    return mod289_4(((x * 34.0) + 1.0) * x);
}

fn taylorInvSqrt(r: vec4<f32>) -> vec4<f32> {
    return 1.79284291400159 - 0.85373472095314 * r;
}

fn perlinNoise3d(P: vec3<f32>) -> f32 {
    var Pi0 = floor(P);
    var Pi1 = Pi0 + vec3<f32>(1.0);
    Pi0 = mod289_3(Pi0);
    Pi1 = mod289_3(Pi1);
    let Pf0 = fract(P);
    let Pf1 = Pf0 - vec3<f32>(1.0);
    let ix = vec4<f32>(Pi0.x, Pi1.x, Pi0.x, Pi1.x);
    let iy = vec4<f32>(Pi0.y, Pi0.y, Pi1.y, Pi1.y);
    let iz0 = Pi0.zzzz;
    let iz1 = Pi1.zzzz;

    let ixy = permute(permute(ix) + iy);
    let ixy0 = permute(ixy + iz0);
    let ixy1 = permute(ixy + iz1);

    var gx0 = ixy0 * (1.0 / 7.0);
    var gy0 = fract(floor(gx0) * (1.0 / 7.0)) - 0.5;
    gx0 = fract(gx0);
    var gz0 = vec4<f32>(0.5) - abs(gx0) - abs(gy0);
    var sz0 = step(gz0, vec4<f32>(0.0));
    gx0 = gx0 + sz0 * (select(vec4<f32>(0.1), vec4<f32>(-0.1), gx0 >= vec4<f32>(0.0)));
    gy0 = gy0 + sz0 * (select(vec4<f32>(0.1), vec4<f32>(-0.1), gy0 >= vec4<f32>(0.0)));

    var gx1 = ixy1 * (1.0 / 7.0);
    var gy1 = fract(floor(gx1) * (1.0 / 7.0)) - 0.5;
    gx1 = fract(gx1);
    var gz1 = vec4<f32>(0.5) - abs(gx1) - abs(gy1);
    var sz1 = step(gz1, vec4<f32>(0.0));
    gx1 = gx1 + sz1 * (select(vec4<f32>(0.1), vec4<f32>(-0.1), gx1 >= vec4<f32>(0.0)));
    gy1 = gy1 + sz1 * (select(vec4<f32>(0.1), vec4<f32>(-0.1), gy1 >= vec4<f32>(0.0)));

    var g000 = vec3<f32>(gx0.x, gy0.x, gz0.x);
    var g100 = vec3<f32>(gx0.y, gy0.y, gz0.y);
    var g010 = vec3<f32>(gx0.z, gy0.z, gz0.z);
    var g110 = vec3<f32>(gx0.w, gy0.w, gz0.w);
    var g001 = vec3<f32>(gx1.x, gy1.x, gz1.x);
    var g101 = vec3<f32>(gx1.y, gy1.y, gz1.y);
    var g011 = vec3<f32>(gx1.z, gy1.z, gz1.z);
    var g111 = vec3<f32>(gx1.w, gy1.w, gz1.w);

    let norm0 = taylorInvSqrt(vec4<f32>(dot(g000, g000), dot(g100, g100), dot(g010, g010), dot(g110, g110)));
    g000 = g000 * norm0.x;
    g100 = g100 * norm0.y;
    g010 = g010 * norm0.z;
    g110 = g110 * norm0.w;
    let norm1 = taylorInvSqrt(vec4<f32>(dot(g001, g001), dot(g101, g101), dot(g011, g011), dot(g111, g111)));
    g001 = g001 * norm1.x;
    g101 = g101 * norm1.y;
    g011 = g011 * norm1.z;
    g111 = g111 * norm1.w;

    let n000 = dot(g000, Pf0);
    let n100 = dot(g100, vec3<f32>(Pf1.x, Pf0.y, Pf0.z));
    let n010 = dot(g010, vec3<f32>(Pf0.x, Pf1.y, Pf0.z));
    let n110 = dot(g110, vec3<f32>(Pf1.x, Pf1.y, Pf0.z));
    let n001 = dot(g001, vec3<f32>(Pf0.x, Pf0.y, Pf1.z));
    let n101 = dot(g101, vec3<f32>(Pf1.x, Pf0.y, Pf1.z));
    let n011 = dot(g011, vec3<f32>(Pf0.x, Pf1.y, Pf1.z));
    let n111 = dot(g111, Pf1);

    var fade_xyz = Pf0 * Pf0 * Pf0 * (Pf0 * (Pf0 * 6.0 - 15.0) + 10.0);
    let n_z = mix(vec4<f32>(n000, n100, n010, n110), vec4<f32>(n001, n101, n011, n111), fade_xyz.z);
    let n_yz = mix(n_z.xy, n_z.zw, fade_xyz.y);
    let n_xyz = mix(n_yz.x, n_yz.y, fade_xyz.x);
    return 2.2 * n_xyz;
}

// --- TWOJA FUNKCJA ISO ---

fn get_iso(p: vec3<f32>) -> f32 {
    // 1. Skalowanie pozycji (im mniejsza liczba, tym większe formacje terenu)
    let frequency = 0.08;
    
    // 2. Pobieramy szum (zwraca wartości w okolicach -1.0 do 1.0)
    let noise = perlinNoise3d(p * frequency + params.seed);
    
    // 3. Dodajemy gradient wysokości (ziemia na dole, powietrze na górze)
    // p.y / size daje 0.0 na dole i 1.0 na górze
    let height_gradient = p.y / f32(size * 2);
    
    // Finalna gęstość: szum + baza - wysokość
    // Dzięki temu teren będzie miał "podłogę"
    let density = noise * 0.5 + 0.5 - height_gradient;
    
    return density;
}

@compute @workgroup_size(8, 4, 4)
fn main(@builtin(global_invocation_id) grid: vec3<u32>) {
    if (grid.x >= size || grid.y >= size || grid.z >= size) { return; }

    let index = grid.x + (grid.y * size) + (grid.z * size * size);
    let worldPos = params.chunkPos + vec3<f32>(grid);

    voxelData[index].blockId = 1;
    voxelData[index].iso = get_iso(worldPos);
}