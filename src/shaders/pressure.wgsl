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
  restitution: f32,
  _pad0: f32,
  _pad1: f32,
  _pad2: f32,
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
@group(0) @binding(1) var<storage, read> densities: array<f32>;
@group(0) @binding(2) var<storage, read_write> pressures: array<f32>;
@group(0) @binding(3) var<uniform> sp: SpatialParams;
@group(0) @binding(4) var<uniform> pp: PhysicsParams;

@compute @workgroup_size(64)
fn cs_main(@builtin(global_invocation_id) global_id: vec3<u32>) {
  let index = global_id.x;

  if (index >= sp.particleCount) { 
    return; 
  }

  let rho = max(densities[index], 1e-8);
  let p = pp.pressureStiffness * (rho - pp.restDensity);
  pressures[index] = max(p, 0.0);
}