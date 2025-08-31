import { Particles } from "../../gfx/Particles";
import { TimeStep } from "../../utils/TimeStep";
import { Gravity } from "./Gravity";
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
  private gravity!: Gravity;
  private particles!: Particles;
  private timeStep!: TimeStep;

  constructor(
    device: GPUDevice,
    sphParams: SphParams,
    particles: Particles,
    timeStep: TimeStep
  ) {
    this.device = device;
    this.sphParams = sphParams;
    this.particles = particles;
    this.timeStep = timeStep;
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
    this.gravity = new Gravity(
      this.device,
      this.sphParams,
      this.timeStep,
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
    this.scatter.resetCellOffsets();

    this.gridCell.buildIndex(encoder);
    this.startGridIndices.buildIndex(encoder);
    this.scatter.buildIndex(encoder);
    this.reorderParticles.buildIndex(encoder);
    this.particlePingPong.buildIndex(encoder);
    this.gravity.buildIndex(encoder);
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
