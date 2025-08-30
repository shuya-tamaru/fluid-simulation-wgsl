import { TransformSystem } from "../utils/TransformSystem";
import { SphParams } from "../compute/sph/SphParams";
import { WireBox } from "../gfx/WireBox";

export class FluidScene {
  private device: GPUDevice;
  private format: GPUTextureFormat;
  private trans: TransformSystem;
  private sphParams: SphParams;
  private wireBox!: WireBox;

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
  }

  updateBoxSize(w: number, h: number, d: number) {
    //prettier-ignore
    this.wireBox.setSize({w,h,d});
  }

  resetSimulation() {}

  draw(pass: GPURenderPassEncoder) {
    this.wireBox.draw(pass);
  }
}
