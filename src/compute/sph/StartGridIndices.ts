import { GridCell } from "./GridCell";
import { SphParams } from "./SphParams";
import calcCellStartIndicesShader from "../../shaders/calcCellStartIndices.wgsl";

export class StartGridIndices {
  private device!: GPUDevice;
  private sphParams!: SphParams;
  private gridCell!: GridCell;

  private cellStartIndicesBuffer!: GPUBuffer;

  private pipeline!: GPUComputePipeline;
  private bindGroupLayout!: GPUBindGroupLayout;

  constructor(device: GPUDevice, gridCell: GridCell, sphParams: SphParams) {
    this.device = device;
    this.gridCell = gridCell;
    this.sphParams = sphParams;

    this.init();
  }

  init() {
    this.createBuffer();
    this.createBufferLayout();
  }

  private makeBindGroup(): GPUBindGroup {
    return this.device.createBindGroup({
      layout: this.bindGroupLayout,
      entries: [
        {
          binding: 0,
          resource: { buffer: this.gridCell.getCellCountsBuffer() },
        },
        {
          binding: 1,
          resource: { buffer: this.cellStartIndicesBuffer },
        },
        {
          binding: 2,
          resource: { buffer: this.sphParams.getBufferSpatial() },
        },
      ],
    });
  }

  private createBuffer() {
    this.cellStartIndicesBuffer = this.device.createBuffer({
      size: this.sphParams.totalCellCount * 4,
      usage:
        GPUBufferUsage.STORAGE |
        GPUBufferUsage.COPY_DST |
        GPUBufferUsage.COPY_SRC,
    });
  }

  private createBufferLayout() {
    const module = this.device.createShaderModule({
      code: calcCellStartIndicesShader,
    });

    this.bindGroupLayout = this.device.createBindGroupLayout({
      entries: [
        {
          binding: 0,
          visibility: GPUShaderStage.COMPUTE,
          buffer: { type: "storage" }, // cellCountsBuffer
        },
        {
          binding: 1,
          visibility: GPUShaderStage.COMPUTE,
          buffer: { type: "storage" }, // cellStartIndicesBuffer
        },
        {
          binding: 2,
          visibility: GPUShaderStage.COMPUTE,
          buffer: { type: "uniform" }, // spatialParams
        },
      ],
    });

    this.pipeline = this.device.createComputePipeline({
      layout: this.device.createPipelineLayout({
        bindGroupLayouts: [this.bindGroupLayout],
      }),
      compute: { module, entryPoint: "cs_main" },
    });
  }

  buildIndex(encoder: GPUCommandEncoder) {
    const pass = encoder.beginComputePass();
    pass.setPipeline(this.pipeline);
    pass.setBindGroup(0, this.makeBindGroup());
    pass.dispatchWorkgroups(Math.ceil(this.sphParams.totalCellCount / 64));
    pass.end();
  }

  getCellStartIndicesBuffer() {
    return this.cellStartIndicesBuffer;
  }

  resetSimulation() {
    this.destroy();
    this.init();
  }

  destroy() {
    this.cellStartIndicesBuffer.destroy();
  }
}
