const VoxelChunksPerColumn = 2;

const VoxelResolution = 32;
const VoxelResolutionOne = VoxelResolution + 1;
const VoxelChunkVolume = VoxelResolutionOne ** 3;

const VoxelDensity = 2;
const VoxelSize = 1 / VoxelDensity;
const VoxelChunkSize = VoxelResolution / VoxelDensity;