struct Voxel {
    blockId: u32,
    iso: f32,
    light: f32,
};

@group(0) @binding(0) var<storage, read_write> voxelData: array<Voxel>;

const size: u32 = 33u;
const isoLevel: f32 = 0.5;
const voxelSize: f32 = 0.5;

@compute @workgroup_size(4, 4, 4)
fn main(@builtin(global_invocation_id) grid: vec3<u32>) {
    if (grid.x >= size || grid.y >= size - 3u || grid.z >= size) { return; }

    let index = grid.x + (grid.y * size) + (grid.z * size * size);

    let indexUp1 = grid.x + (grid.y + 1u * size) + (grid.z * size * size);
    let indexUp2 = grid.x + (grid.y + 2u * size) + (grid.z * size * size);
    let indexUp3 = grid.x + (grid.y + 3u * size) + (grid.z * size * size);

    if(voxelData[index].blockId == 1u){
        if(voxelData[indexUp1].blockId == 0u) {
            voxelData[index].blockId = 2u;
        } else if(voxelData[indexUp2].blockId == 0u || voxelData[indexUp3].blockId == 0u){
            voxelData[index].blockId = 3u;
        }
    }
}