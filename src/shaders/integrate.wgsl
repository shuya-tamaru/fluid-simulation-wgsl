struct TimeStep {
  dt: f32, 
  _pad0: f32, 
  _pad1: f32, 
  _pad2: f32,
};

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


const GRAVITY: f32 = 9.8 ;

@group(0) @binding(0) var<storage, read_write> positions:      array<vec4<f32>>;
@group(0) @binding(1) var<storage, read_write> velocities:     array<vec4<f32>>;
@group(0) @binding(2) var<storage, read>       pressureForces: array<vec4<f32>>; // Force
@group(0) @binding(3) var<storage, read>       viscosityForces:array<vec4<f32>>; // Force
@group(0) @binding(4) var<uniform>             sp:             SpatialParams;
@group(0) @binding(5) var<uniform>             pp:             PhysicsParams;
@group(0) @binding(6) var<uniform>             ts:             TimeStep;

@compute @workgroup_size(64)
fn cs_main(@builtin(global_invocation_id) gid: vec3<u32>) {
  let i = gid.x;
  if (i >= sp.particleCount) { return; }

  var pos = positions[i].xyz;
  var vel = velocities[i].xyz;

  let Fp = pressureForces[i].xyz;
  let Fv = viscosityForces[i].xyz;

  let invMass = 1.0 / max(pp.mass, 1e-8);
  let a = (Fp + Fv ) * invMass ;

  vel = vel + a * ts.dt;
  pos = pos + vel * ts.dt;

  positions[i]  = vec4<f32>(pos, 0.0);
  velocities[i] = vec4<f32>(vel, 0.0);
}
