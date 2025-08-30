struct TransformData {
  model: mat4x4<f32>,
  view: mat4x4<f32>,
  projection: mat4x4<f32>,
};


@group(0) @binding(0) var<uniform> transform: TransformData;

struct VSOut { 
  @builtin(position) pos: vec4<f32>
 };

@vertex
fn vs_main(@location(0) position: vec3<f32>) -> VSOut {
  var o: VSOut;
  let p = vec4<f32>(position, 1.0);
  o.pos = transform.projection * transform.view * transform.model * p;
  return o;
}

@fragment
fn fs_main() -> @location(0) vec4<f32> {
  return vec4<f32>(1.0, 1.0, 1.0, 1.0);
}