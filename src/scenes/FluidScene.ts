import { WireBox } from "../gfx/WireBox";
import { Particles } from "../gfx/Particles";

export class FluidScene {
  private wireBox!: WireBox;
  private particles!: Particles;

  constructor(wireBox: WireBox, particles: Particles) {
    this.wireBox = wireBox;
    this.particles = particles;
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
