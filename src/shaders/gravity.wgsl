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

@group(0) @binding(0) var<storage, read_write> positions: array<vec4<f32>>;
@group(0) @binding(1) var<storage, read_write> velocities: array<vec4<f32>>; 
@group(0) @binding(2) var<uniform> timeStep: TimeStep;
@group(0) @binding(3) var<uniform> sp: SpatialParams;
@group(0) @binding(4) var<uniform> pp: PhysicsParams;

const GRAVITY: f32 = 9.8 ;

@compute @workgroup_size(64)
fn cs_main(@builtin(global_invocation_id) global_id: vec3<u32>) {
    let index = global_id.x;
    if (index >= sp.particleCount) { 
        return; 
    }
    let currentPosition = positions[index].xyz;
    let currentVelocity = velocities[index].xyz;

    var newVelocity = currentVelocity + vec3<f32>(0.0, -GRAVITY, 0.0) * timeStep.dt;
    var newPosition = currentPosition + newVelocity * timeStep.dt;

      // X方向の境界判定
  if (abs(newPosition.x) > sp.boxWidth * 0.5) {
    newPosition.x = sp.boxWidth * 0.5 * sign(newPosition.x);
    newVelocity.x *= -1.0 * (1.0 - pp.restitution);
  }

  //Y方向の境界判定
  if (newPosition.y > sp.boxHeight) {
    newPosition.y = sp.boxHeight * 0.5 * sign(newPosition.y);
    newVelocity.y *= -1.0 * (1.0 - pp.restitution);
  }
  //Y方向の境界判定
  if (newPosition.y < -sp.boxHeight * 0.5) {
    newPosition.y = sp.boxHeight * 0.5 * sign(newPosition.y);
    newVelocity.y *= -1.0 * (1.0 - pp.restitution);
  }

  // Z方向の境界判定（2Dなら不要だが一応）
  if (abs(newPosition.z) > sp.boxDepth * 0.5) {
    newPosition.z = sp.boxDepth * 0.5 * sign(newPosition.z);
    newVelocity.z *= -1.0 * (1.0 - pp.restitution);
  }



    positions[index] = vec4<f32>(newPosition, 0.0);
    velocities[index] = vec4<f32>(newVelocity, 0.0);

  

    
}