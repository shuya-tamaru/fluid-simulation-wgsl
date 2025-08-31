import scatterShader from "../../shaders/scatter.wgsl";
import { GridCell } from "./GridCell";
import { SphParams } from "./SphParams";
import { StartGridIndices } from "./StartGridIndices";

export class Scatter {
  private device: GPUDevice;
  private gridCell!: GridCell;
  private startGridIndices!: StartGridIndices;
  private sphParams!: SphParams;

  public gridParticleIdsBuffer!: GPUBuffer;
  private cellOffsetsBuffer!: GPUBuffer;

  private pipeline!: GPUComputePipeline;
  private bindGroupLayout!: GPUBindGroupLayout;

  constructor(
    device: GPUDevice,
    gridCell: GridCell,
    startGridIndices: StartGridIndices,
    sphParams: SphParams
  ) {
    this.device = device;
    this.gridCell = gridCell;
    this.startGridIndices = startGridIndices;
    this.sphParams = sphParams;

    this.init();
  }

  init() {
    this.createBuffer();
    this.createBufferLayout();
  }

  createBufferLayout() {
    const module = this.device.createShaderModule({
      code: scatterShader,
    });

    this.bindGroupLayout = this.device.createBindGroupLayout({
      entries: [
        {
          binding: 0,
          visibility: GPUShaderStage.COMPUTE,
          buffer: { type: "read-only-storage" }, // cellIndicesBuffer
        },
        {
          binding: 1,
          visibility: GPUShaderStage.COMPUTE,
          buffer: { type: "read-only-storage" }, // cellStartIndicesBuffer
        },
        {
          binding: 2,
          visibility: GPUShaderStage.COMPUTE,
          buffer: { type: "storage" }, // gridParticleIdsBuffer
        },
        {
          binding: 3,
          visibility: GPUShaderStage.COMPUTE,
          buffer: { type: "storage" }, // cellOffsetsBuffer
        },
        {
          binding: 4,
          visibility: GPUShaderStage.COMPUTE,
          buffer: { type: "uniform" }, // spatialParamsBuffer
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

  private makeBindGroup(): GPUBindGroup {
    return this.device.createBindGroup({
      layout: this.bindGroupLayout,
      entries: [
        {
          binding: 0,
          resource: { buffer: this.gridCell.getCellIndicesBuffer() },
        },
        {
          binding: 1,
          resource: {
            buffer: this.startGridIndices.getCellStartIndicesBuffer(),
          },
        },
        {
          binding: 2,
          resource: { buffer: this.gridParticleIdsBuffer },
        },
        {
          binding: 3,
          resource: { buffer: this.cellOffsetsBuffer },
        },
        {
          binding: 4,
          resource: { buffer: this.sphParams.getBufferSpatial() },
        },
      ],
    });
  }

  private createBuffer() {
    this.gridParticleIdsBuffer = this.device.createBuffer({
      size: this.sphParams.particleCount * 4,
      usage:
        GPUBufferUsage.STORAGE |
        GPUBufferUsage.COPY_DST |
        GPUBufferUsage.COPY_SRC,
    });

    this.cellOffsetsBuffer = this.device.createBuffer({
      size: this.sphParams.totalCellCount * 4,
      usage:
        GPUBufferUsage.STORAGE |
        GPUBufferUsage.COPY_DST |
        GPUBufferUsage.COPY_SRC,
    });
    this.device.queue.writeBuffer(
      this.cellOffsetsBuffer,
      0,
      new Uint32Array(this.sphParams.totalCellCount)
    );
  }

  resetCellOffsets() {
    this.device.queue.writeBuffer(
      this.cellOffsetsBuffer,
      0,
      new Uint32Array(this.sphParams.totalCellCount)
    );
  }

  buildIndex(encoder: GPUCommandEncoder) {
    const pass = encoder.beginComputePass();
    pass.setPipeline(this.pipeline);
    pass.setBindGroup(0, this.makeBindGroup());
    pass.dispatchWorkgroups(Math.ceil(this.sphParams.particleCount / 64));
    pass.end();
  }

  getGridParticleIdsBuffer() {
    return this.gridParticleIdsBuffer;
  }

  getCellOffsetsBuffer() {
    return this.cellOffsetsBuffer;
  }

  destroy() {
    this.gridParticleIdsBuffer.destroy();
    this.cellOffsetsBuffer.destroy();
  }
}
