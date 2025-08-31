
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
@group(0) @binding(1) var<storage, read_write> densities: array<f32>;
@group(0) @binding(2) var<storage, read> cellStartIndices: array<u32>;
@group(0) @binding(3) var<storage, read> cellCounts: array<u32>;
@group(0) @binding(4) var<uniform> sp: SpatialParams;
@group(0) @binding(5) var<uniform> pp: PhysicsParams;

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

  let pi = positions[index].xyz;     // ★reordered 配列の i 番目
  var rho = 0.0;

  // 自セル座標
  let cc = pos_to_cell_coord(pi);

  // 27セルを走査（-1..1 の立方近傍）
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

        // セル内の粒子は reorded 配列で連続
        var k = start;
        loop {
          if (k >= end) { break; }
         
          if (k != index) {                   
            let pj = positions[k].xyz;
            let r  = pi - pj;
            let r2 = dot(r, r);
            if (r2 < pp.h2) {
              let t = pp.h2 - r2;
              rho += pp.mass * pp.poly6 * (t*t*t);
            }
          }
          k = k + 1u;
        }
      }
    }
  }

  let h6 = pp.h2 * pp.h2 * pp.h2;
  rho += pp.mass * pp.poly6 * h6;

  densities[index] = rho;
}
