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

@binding(0) @group(0) var<storage, read_write> cellCounts: array<atomic<u32>>;
@binding(1) @group(0) var<storage, read_write> cellStartIndices: array<u32>;
@binding(2) @group(0) var<uniform> sp: SpatialParams;

@compute @workgroup_size(64)
fn cs_main(@builtin(global_invocation_id) global_id: vec3<u32>) {
  if (global_id.x != 0u) { return; }
  var acc: u32 = 0u;

  var i: u32 = 0u;
  loop {
    if (i >= sp.totalCellCount) { break; }
    cellStartIndices[i] = acc;              
    acc += atomicLoad(&cellCounts[i]);      
    i += 1u;
  }
}