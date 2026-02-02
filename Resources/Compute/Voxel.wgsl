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
const isoLevel: f32 = 0.5;
const voxelSize: f32 = 0.5;

// --- FUNKCJE SZUMU (PERLIN 3D) ---

fn mod289_vec3(x: vec3<f32>) -> vec3<f32> { return x - floor(x * (1.0 / 289.0)) * 289.0; }
fn mod289_vec4(x: vec4<f32>) -> vec4<f32> { return x - floor(x * (1.0 / 289.0)) * 289.0; }
fn permute_vec4(x: vec4<f32>) -> vec4<f32> { return mod289_vec4(((x * 34.0) + 1.0) * x); }
fn taylorInvSqrt_vec4(r: vec4<f32>) -> vec4<f32> { return 1.79284291400159 - 0.85373472095314 * r; }

fn simplexNoise3d(v: vec3<f32>) -> f32 {
    let C = vec2<f32>(1.0/6.0, 1.0/3.0);
    let D = vec4<f32>(0.0, 0.5, 1.0, 2.0);

    // Pierwszy wierzchołek
    var i  = floor(v + dot(v, C.yyy));
    let x0 = v - i + dot(i, C.xxx);

    // Pozostałe wierzchołki
    let g = step(x0.yzx, x0.xyz);
    let l = 1.0 - g;
    let i1 = min(g.xyz, l.zxy);
    let i2 = max(g.xyz, l.zxy);

    let x1 = x0 - i1 + C.xxx;
    let x2 = x0 - i2 + C.yyy;
    let x3 = x0 - D.yyy;

    // Permutacje
    i = mod289_vec3(i);
    let p = permute_vec4(permute_vec4(permute_vec4(
              i.z + vec4<f32>(0.0, i1.z, i2.z, 1.0))
            + i.y + vec4<f32>(0.0, i1.y, i2.y, 1.0))
            + i.x + vec4<f32>(0.0, i1.x, i2.x, 1.0));

    // Gradienty (4 wierzchołki na siatce simplexu)
    let n_ = 0.142857142857; // 1.0/7.0
    let ns = n_ * D.wyz - D.xzx;

    let j = p - 49.0 * floor(p * ns.z * ns.z);

    let x_ = floor(j * ns.z);
    let y_ = floor(j - 7.0 * x_);

    let x = x_ * ns.x + ns.yyyy;
    let y = y_ * ns.x + ns.yyyy;
    let h = 1.0 - abs(x) - abs(y);

    let b0 = vec4<f32>(x.xy, y.xy);
    let b1 = vec4<f32>(x.zw, y.zw);

    let s0 = floor(b0) * 2.0 + 1.0;
    let s1 = floor(b1) * 2.0 + 1.0;
    let sh = -step(h, vec4<f32>(0.0));

    let a0 = b0.xzyw + s0.xzyw * sh.xxyy;
    let a1 = b1.xzyw + s1.xzyw * sh.zzww;

    var p0 = vec3<f32>(a0.xy, h.x);
    var p1 = vec3<f32>(a0.zw, h.y);
    var p2 = vec3<f32>(a1.xy, h.z);
    var p3 = vec3<f32>(a1.zw, h.w);

    // Normalizacja
    let norm = taylorInvSqrt_vec4(vec4<f32>(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
    p0 = p0 * norm.x;
    p1 = p1 * norm.y;
    p2 = p2 * norm.z;
    p3 = p3 * norm.w;

    // Miksowanie końcowe
    var m = max(0.6 - vec4<f32>(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), vec4<f32>(0.0));
    m = m * m;
    return 42.0 * dot(m * m, vec4<f32>(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
}

fn perlinNoise3d(P: vec3<f32>) -> f32 {
    var Pi0 = floor(P);
    var Pi1 = Pi0 + vec3<f32>(1.0);
    Pi0 = mod289_vec3(Pi0);
    Pi1 = mod289_vec3(Pi1);
    let Pf0 = fract(P);
    let Pf1 = Pf0 - vec3<f32>(1.0);
    let ix = vec4<f32>(Pi0.x, Pi1.x, Pi0.x, Pi1.x);
    let iy = vec4<f32>(Pi0.y, Pi0.y, Pi1.y, Pi1.y);
    let iz0 = Pi0.zzzz;
    let iz1 = Pi1.zzzz;

    let ixy = permute_vec4(permute_vec4(ix) + iy);
    let ixy0 = permute_vec4(ixy + iz0);
    let ixy1 = permute_vec4(ixy + iz1);

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

    let norm0 = taylorInvSqrt_vec4(vec4<f32>(dot(g000, g000), dot(g100, g100), dot(g010, g010), dot(g110, g110)));
    g000 = g000 * norm0.x;
    g100 = g100 * norm0.y;
    g010 = g010 * norm0.z;
    g110 = g110 * norm0.w;
    let norm1 = taylorInvSqrt_vec4(vec4<f32>(dot(g001, g001), dot(g101, g101), dot(g011, g011), dot(g111, g111)));
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
    
    let height_gradient : f32 = 16 - p.y;

    var frequency : f32 = 0.04;
    var strength : f32 = 4;
    var density : f32 = 0.0;

    for(var i = 0u; i < 4u; i += 1u){
        let noise = simplexNoise3d(p * frequency + params.seed);
        density = density + noise * strength;

        strength = strength / 2;
        frequency = frequency * 2.0;
    }
    
    return height_gradient + density;
}

@compute @workgroup_size(4, 4, 4)
fn main(@builtin(global_invocation_id) grid: vec3<u32>) {
    if (grid.x >= size || grid.y >= size || grid.z >= size) { return; }

    let index = grid.x + (grid.y * size) + (grid.z * size * size);
    let worldPos = (params.chunkPos + vec3<f32>(grid) * voxelSize);
    
    if(worldPos.y == 0){
        voxelData[index].iso = 0.0;
        voxelData[index].blockId = 0u;
    } else {
        let iso = get_iso(worldPos);
        voxelData[index].iso = iso;
        voxelData[index].blockId = select(1u, 0u, iso < isoLevel);
    }
}