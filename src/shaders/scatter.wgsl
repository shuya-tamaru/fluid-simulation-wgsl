struct SpatialParams {
  cellSize: f32,
  xMin: f32,
  yMin: f32,
  zMin: f32,
  boxWidth: f32,
  boxHeight: f32,
  boxDepth: f32,
  _pad0: f32,
  particleCount: u32,
  cellCountX: u32,
  cellCountY: u32,
  cellCountZ: u32,
  totalCellCount: u32,
  _pad1: u32,
  _pad2: u32,
  _pad3: u32,
};

@group(0) @binding(0) var<storage, read> cellIndices: array<u32>;
@group(0) @binding(1) var<storage, read> cellStartIndices: array<u32>;
@group(0) @binding(2) var<storage, read_write> gridParticleIds: array<u32>;
@group(0) @binding(3) var<storage, read_write> cellOffsets:array<atomic<u32>>;
@group(0) @binding(4) var<uniform> sp: SpatialParams;


@compute @workgroup_size(64)
fn cs_main(@builtin(global_invocation_id) global_id: vec3<u32>) {
  let i = global_id.x;
  if (i >= sp.particleCount) { return; }

  let cid = cellIndices[i];
  let ofs = atomicAdd(&cellOffsets[cid], 1u);
  let dst = cellStartIndices[cid] + ofs;
  gridParticleIds[dst] = i;
}