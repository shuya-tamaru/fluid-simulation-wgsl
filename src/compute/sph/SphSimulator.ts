import { Particles } from "../../gfx/Particles";
import { GridCell } from "./GridCell";
import { SphParams } from "./SphParams";

export class SphSimulator {
  private device: GPUDevice;
  private sphParams: SphParams;
  private gridCell!: GridCell;
  private particles!: Particles;

  constructor(device: GPUDevice, sphParams: SphParams, particles: Particles) {
    this.device = device;
    this.sphParams = sphParams;
    this.particles = particles;
    this.init();
  }

  init() {
    this.gridCell = new GridCell(this.device, this.sphParams, this.particles);
  }

  getInstance() {
    return {
      gridCell: this.gridCell,
      particles: this.particles,
    };
  }

  compute(encoder: GPUCommandEncoder) {
    this.gridCell.resetCellCounts();
    this.gridCell.buildIndex(encoder);
  }

  resetSimulation() {
    this.gridCell.resetSimulation();
  }
}
