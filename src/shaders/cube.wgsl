struct Transforms {
  model : mat4x4<f32>,
  view  : mat4x4<f32>,
  proj  : mat4x4<f32>,
};
struct VSIn  { @location(0) pos: vec3<f32>, @location(1) nrm: vec3<f32> };
struct VSOut { @builtin(position) pos: vec4<f32>, @location(0) nrmW: vec3<f32> };

const AMBIENT : f32 = 0.52;
const KD      : f32 = 0.88;
const BASE    : vec3<f32> = vec3(0.2, 0.6, 0.1);

@group(0) @binding(0) var<uniform> uTrans : Transforms;
@vertex
fn vs_main(i: VSIn) -> VSOut {
  var o: VSOut;
  let m  = uTrans.model;
  let vp = uTrans.proj * uTrans.view;
  o.pos  = vp * m * vec4<f32>(i.pos, 1.0);
  o.nrmW = (m * vec4<f32>(i.nrm, 0.0)).xyz;
  return o;
}

@fragment
fn fs_main(i: VSOut) -> @location(0) vec4<f32> {
  let  L        = normalize(vec3(0.5, 0.8, 0.2));
  let N     = normalize(i.nrmW);
  let diff  = max(dot(N, L), 0.0);
  let color = BASE * (AMBIENT + KD * diff);
  return vec4<f32>(color, 1.0);
}