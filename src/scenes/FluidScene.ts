import { TransformSystem } from "../utils/TransformSystem";
import { SphParams } from "../compute/sph/SphParams";
import { WireBox } from "../gfx/WireBox";
import { Particles } from "../gfx/Particles";
import { SphereInstance } from "../gfx/SphereInstance";

export class FluidScene {
  private device: GPUDevice;
  private format: GPUTextureFormat;
  private trans: TransformSystem;
  private sphParams: SphParams;
  private wireBox!: WireBox;
  private particles!: Particles;
  private sphereInstance!: SphereInstance;

  constructor(
    device: GPUDevice,
    format: GPUTextureFormat,
    trans: TransformSystem,
    sphParams: SphParams
  ) {
    this.device = device;
    this.format = format;
    this.trans = trans;
    this.sphParams = sphParams;
    this.init();
  }

  init() {
    this.wireBox = new WireBox(
      this.device,
      this.format,
      this.trans.getBuffer(),
      this.sphParams
    );
    this.sphereInstance = new SphereInstance(this.device);
    this.particles = new Particles(
      this.device,
      this.format,
      this.trans,
      this.sphParams,
      this.sphereInstance
    );
  }

  updateBoxSize(w: number, h: number, d: number) {
    //prettier-ignore
    this.wireBox.setSize({w,h,d});
  }

  resetSimulation() {
    this.particles.resetParticles();
  }

  draw(pass: GPURenderPassEncoder) {
    this.wireBox.draw(pass);
    this.particles.draw(pass);
  }
}
