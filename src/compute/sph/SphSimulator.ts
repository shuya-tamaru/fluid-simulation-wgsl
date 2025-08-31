import { Particles } from "../../gfx/Particles";
import { GridCell } from "./GridCell";
import { SphParams } from "./SphParams";
import { StartGridIndices } from "./StartGridIndices";

export class SphSimulator {
  private device: GPUDevice;
  private sphParams: SphParams;
  private gridCell!: GridCell;
  private startGridIndices!: StartGridIndices;
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
  }

  getInstance() {
    return {
      gridCell: this.gridCell,
      startGridIndices: this.startGridIndices,
      particles: this.particles,
    };
  }

  compute(encoder: GPUCommandEncoder) {
    this.gridCell.resetCellCounts();
    this.gridCell.buildIndex(encoder);
    this.startGridIndices.buildIndex(encoder);
  }

  resetSimulation() {
    this.gridCell.destroy();
    this.startGridIndices.destroy();
    this.gridCell.init();
    this.startGridIndices.init();
  }
}
