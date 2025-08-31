import { Particles } from "../../gfx/Particles";
import { GridCell } from "./GridCell";
import { ParticlePingPong } from "./ParticlePingPong";
import { ReOrderParticles } from "./ReorderParticles";
import { Scatter } from "./Scatter";
import { SphParams } from "./SphParams";
import { StartGridIndices } from "./StartGridIndices";

export class SphSimulator {
  private device: GPUDevice;
  private sphParams: SphParams;
  private gridCell!: GridCell;
  private startGridIndices!: StartGridIndices;
  private scatter!: Scatter;
  private reorderParticles!: ReOrderParticles;
  private particlePingPong!: ParticlePingPong;
  private particles!: Particles;

  constructor(device: GPUDevice, sphParams: SphParams, particles: Particles) {
    this.device = device;
    this.sphParams = sphParams;
    this.particles = particles;
    this.init();
  }

  init() {
    this.gridCell = new GridCell(this.device, this.sphParams, this.particles);
    this.startGridIndices = new StartGridIndices(
      this.device,
      this.gridCell,
      this.sphParams
    );
    this.scatter = new Scatter(
      this.device,
      this.gridCell,
      this.startGridIndices,
      this.sphParams
    );
    this.reorderParticles = new ReOrderParticles(
      this.device,
      this.sphParams,
      this.scatter,
      this.particles
    );
    this.particlePingPong = new ParticlePingPong(
      this.device,
      this.sphParams,
      this.particles
    );
  }

  getInstance() {
    return {
      gridCell: this.gridCell,
      startGridIndices: this.startGridIndices,
      scatter: this.scatter,
      reorderParticles: this.reorderParticles,
      particles: this.particles,
      particlePingPong: this.particlePingPong,
    };
  }

  compute(encoder: GPUCommandEncoder) {
    this.gridCell.resetCellCounts();
    this.gridCell.buildIndex(encoder);
    this.startGridIndices.buildIndex(encoder);
    this.scatter.buildIndex(encoder);
    this.reorderParticles.buildIndex(encoder);
    // this.particlePingPong.buildIndex(encoder);
  }

  resetSimulation() {
    this.gridCell.destroy();
    this.startGridIndices.destroy();
    this.scatter.destroy();
    this.gridCell.init();
    this.startGridIndices.init();
    this.scatter.init();
  }
}
