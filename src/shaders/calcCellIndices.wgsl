struct PhysicsParams {
  h: f32,
  h2: f32,
  h3: f32,
  h6: f32,
  h9: f32,
  poly6: f32,
  spiky: f32,
  viscosity: f32,
  mass: f32,
  restDensity: f32,
  pressureStiffness: f32,
  viscosityMu: f32,
  tangentDamping: f32,
  restitution: f32,
  _pad0: f32,
  _pad1: f32,
};

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

@group(0) @binding(0) var<storage, read> positions: array<vec4<f32>>;
@group(0) @binding(1) var<storage, read_write> cellIndices: array<u32>;
@group(0) @binding(2) var<storage, read_write> cellCounts: array<atomic<u32>>;
@group(0) @binding(3) var<uniform> pp: PhysicsParams;
@group(0) @binding(4) var<uniform> sp: SpatialParams;


fn pos_to_cell_index(p: vec3<f32>) -> u32 {
  let res = (p - vec3(sp.xMin, sp.yMin, sp.zMin)) / sp.cellSize;
  let cx = i32(floor(res.x));
  let cy = i32(floor(res.y));
  let cz = i32(floor(res.z));

  let cxc = clamp(cx, 0, i32(sp.cellCountX) - 1);
  let cyc = clamp(cy, 0, i32(sp.cellCountY) - 1);
  let czc = clamp(cz, 0, i32(sp.cellCountZ) - 1);

  return u32(cxc)
      + u32(cyc) * sp.cellCountX
      + u32(czc) * sp.cellCountX * sp.cellCountY;
}

@compute @workgroup_size(64)
fn cs_main(@builtin(global_invocation_id) global_id: vec3<u32>) {
  let index = global_id.x;
  if (index >= sp.particleCount) {
    return;
  }
  let pos = positions[index].xyz;
  let cellIndex = pos_to_cell_index(pos);
  cellIndices[index] = cellIndex;
  atomicAdd(&(cellCounts[cellIndex]), 1u);
}