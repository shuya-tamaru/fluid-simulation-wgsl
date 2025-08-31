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
@group(0) @binding(2) var<storage, read> cellStartIndices: array<u32>;
@group(0) @binding(3) var<storage, read> cellCounts: array<u32>;
@group(0) @binding(4) var<storage, read> pressures: array<f32>;
@group(0) @binding(5) var<uniform> sp: SpatialParams;
@group(0) @binding(6) var<uniform> pp: PhysicsParams;
@group(0) @binding(7) var<storage, read_write> pressureForces: array<vec4<f32>>;



fn pos_to_cell_coord(p: vec3<f32>) -> vec3<i32> {
  let r = (p - vec3(sp.xMin, sp.yMin, sp.zMin))
          / sp.cellSize;
  return vec3<i32>(
    clamp(i32(floor(r.x)), 0, i32(sp.cellCountX)-1),
    clamp(i32(floor(r.y)), 0, i32(sp.cellCountY)-1),
    clamp(i32(floor(r.z)), 0, i32(sp.cellCountZ)-1)
  );
}

fn coord_to_index(c: vec3<i32>) -> u32 {
  return u32(c.x) + u32(c.y)*sp.cellCountX + u32(c.z)*sp.cellCountX*sp.cellCountY;
}

@compute @workgroup_size(64)
fn cs_main(@builtin(global_invocation_id) global_id: vec3<u32>) {
  let index = global_id.x;

  if (index >= sp.particleCount) { 
    return; 
  }

  let pi = positions[index].xyz;
  let pi_press = pressures[index];
  var rhoi = max(densities[index], 1e-8);

  var fi = vec3<f32>(0.0);

  let cc = pos_to_cell_coord(pi);

  for (var dz = -1; dz <= 1; dz = dz + 1) {
    let zc = clamp(cc.z + dz, 0, i32(sp.cellCountZ)-1);
    for (var dy = -1; dy <= 1; dy = dy + 1) {
      let yc = clamp(cc.y + dy, 0, i32(sp.cellCountY)-1);
      for (var dx = -1; dx <= 1; dx = dx + 1) {
        let xc = clamp(cc.x + dx, 0, i32(sp.cellCountX)-1);
  
        let cidx = coord_to_index(vec3<i32>(xc, yc, zc));
        let start = cellStartIndices[cidx];
        let count = cellCounts[cidx];
        let end   = start + count;

        var k = start;
        loop {
          if (k >= end) { break; }

          if (k != index) {                   
            let pj = positions[k].xyz;
            let d  = pi - pj;
            let r2 = dot(d, d);
            if (r2 < pp.h2) {
              let rinv = inverseSqrt(max(r2, 1e-8 * pp.h2));
              let r    = 1.0 / rinv;
              let t    = pp.h - r;
              if(t > 0.0) {
                let dir  = d * rinv; 
                let gradW = pp.spiky * (t * t) * dir;
                let rhoj = max(densities[k], 1e-8);
                let pj_press = pressures[k];
                let term = (pi_press / (rhoi * rhoi)) + (pj_press / (rhoj * rhoj));
                fi += -(pp.mass * pp.mass) * term * gradW; 
              }
            }
          }
          k = k + 1u;
        }
      }
    }
  }
  pressureForces[index] = vec4<f32>(fi / 4.0, 0.0);
}
  