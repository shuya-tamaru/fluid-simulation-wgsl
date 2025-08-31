import { Particles } from "../../gfx/Particles";
import { TimeStep } from "../../utils/TimeStep";
import { Density } from "./Density";
import { Gravity } from "./Gravity";
import { GridCell } from "./GridCell";
import { ParticlePingPong } from "./ParticlePingPong";
import { Pressure } from "./Pressure";
import { ReOrderParticles } from "./ReorderParticles";
import { Scatter } from "./Scatter";
import { SphParams } from "./SphParams";
import { StartGridIndices } from "./StartGridIndices";

export class SphSimulator {
  private device: GPUDevice;
  private particles!: Particles;
  private timeStep!: TimeStep;
  private sphParams: SphParams;

  private gridCell!: GridCell;
  private startGridIndices!: StartGridIndices;
  private scatter!: Scatter;
  private reorderParticles!: ReOrderParticles;
  private particlePingPong!: ParticlePingPong;
  private gravity!: Gravity;
  private density!: Density;
  private pressure!: Pressure;

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
    this.density = new Density(
      this.device,
      this.sphParams,
      this.particles,
      this.gridCell,
      this.startGridIndices
    );
    this.pressure = new Pressure(
      this.device,
      this.particles,
      this.sphParams,
      this.density
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
      density: this.density,
      pressure: this.pressure,
    };
  }

  updateSphParams(w: number, d: number) {
    this.sphParams.updateSphParams(w, d);
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
    this.density.buildIndex(encoder);
    this.pressure.buildIndex(encoder);
  }

  resetSimulation() {
    this.gridCell.destroy();
    this.startGridIndices.destroy();
    this.scatter.destroy();
    this.density.destroy();
    this.pressure.destroy();

    this.gridCell.init();
    this.startGridIndices.init();
    this.scatter.init();
    this.density.init();
    this.pressure.init();
  }
}
