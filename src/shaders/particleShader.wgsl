struct TransformData {
   model: mat4x4<f32>,
   view: mat4x4<f32>,
   projection: mat4x4<f32>,
}

struct VertexOutput {
  @builtin(position) position: vec4<f32>,
  @location(0) color: vec4<f32>,
}

const RADIUS: f32 = 0.2;
const EMISSIVE_GAIN: f32 = 1.2;
const MAX_SPEED: f32 = 10.0;

@group(0) @binding(0) var<uniform> transformUBO: TransformData;
@group(0) @binding(1) var<storage, read> positions: array<vec4<f32>>;
@group(0) @binding(2) var<storage, read> velocities: array<vec4<f32>>; 

fn velocity_to_color_ocean(velocity: vec3<f32>) -> vec3<f32> {
  let speed = length(velocity);

  let t = clamp(speed / MAX_SPEED, 0.0, 1.0);

  if (t < 0.7) {
    let k = t / 0.7;
    return mix(vec3<f32>(0.0, 0.1, 0.4), vec3<f32>(0.0, 0.6, 0.8), k);
  } else {
    let k = (t - 0.7) / 0.3;
    return mix(vec3<f32>(0.0, 0.6, 0.8), vec3<f32>(1.0, 1.0, 1.0), k);
  }
}


@vertex
fn vs_main(
  @location(0) vertPos: vec4<f32>,
  @builtin(instance_index) iid: u32
) -> VertexOutput {
  var output: VertexOutput;
  let center = positions[iid];
  let velocity = velocities[iid];
  let worldPos = center.xyz + vertPos.xyz * RADIUS;
  let mvp = transformUBO.projection * transformUBO.view * transformUBO.model;
  output.position = mvp * vec4<f32>(worldPos, 1.0);
  let normal = normalize(vertPos.xyz);

  let lightDir = normalize(vec3<f32>(0.3, 1.0, 0.5)); // 上から斜め
  let lightColor = vec3<f32>(1.0, 1.0, 1.0);
  let ambient = 0.5;

  let diff = max(dot(normal, lightDir), 0.0);

  let baseColor = velocity_to_color_ocean(velocity.xyz);
  let speed = length(velocity.xyz);
  let t = clamp(speed * 1.5 + 1.0 / MAX_SPEED, 0.0, 1.0);
  let emissive = baseColor * (EMISSIVE_GAIN * 0.4 * smoothstep(0.6, 1.0, t));

  let shaded = baseColor * (ambient + diff * 0.8);
  
  output.color = vec4<f32>(shaded + emissive, 1.0);

  return output;
}

@fragment
fn fs_main(@location(0) color: vec4<f32>) -> @location(0) vec4<f32> {
  return color;
}