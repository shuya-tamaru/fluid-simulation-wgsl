import type { SphParams } from "../compute/sph/SphParams";
import { Particles } from "../gfx/Particles";
import { SphereInstance } from "../gfx/SphereInstance";
import { WireBox } from "../gfx/WireBox";
import { TimeStep } from "../utils/TimeStep";
import type { TransformSystem } from "../utils/TransformSystem";

export function createAssets(
  device: GPUDevice,
  format: GPUTextureFormat,
  trans: TransformSystem,
  sphParams: SphParams
) {
  const wireBox = new WireBox(device, format, trans.getBuffer(), sphParams);
  const sphereInstance = new SphereInstance(device);
  const particles = new Particles(
    device,
    format,
    trans,
    sphParams,
    sphereInstance
  );
  const timeStep = new TimeStep(device);
  return { wireBox, sphereInstance, particles, timeStep };
}
