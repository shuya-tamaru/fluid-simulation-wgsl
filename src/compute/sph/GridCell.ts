import type { Particles } from "../../gfx/Particles";
import { SphParams } from "./SphParams";
import calcCellIndicesShader from "../../shaders/calcCellIndices.wgsl";

export class GridCell {
  private device!: GPUDevice;
  private sphParams!: SphParams;
  private particles!: Particles;

  private cellIndicesBuffer!: GPUBuffer;
  private cellCountsBuffer!: GPUBuffer;

  private pipeline!: GPUComputePipeline;
  private bindGroupLayout!: GPUBindGroupLayout;

  constructor(device: GPUDevice, sphParams: SphParams, particles: Particles) {
    this.device = device;
    this.sphParams = sphParams;
    this.particles = particles;
    this.init();
  }

  init() {
    this.createBufferLayout();
    this.createBuffer();
  }

  createBufferLayout() {
    const module = this.device.createShaderModule({
      code: calcCellIndicesShader,
    });

    this.bindGroupLayout = this.device.createBindGroupLayout({
      entries: [
        {
          binding: 0,
          visibility: GPUShaderStage.COMPUTE,
          buffer: { type: "read-only-storage" }, // positionsBuffer
        },
        {
          binding: 1,
          visibility: GPUShaderStage.COMPUTE,
          buffer: { type: "storage" }, // cellIndicesBuffer
        },
        {
          binding: 2,
          visibility: GPUShaderStage.COMPUTE,
          buffer: { type: "storage" }, // cellCountsBuffer
        },
        {
          binding: 3,
          visibility: GPUShaderStage.COMPUTE,
          buffer: { type: "uniform" }, // physicsParamsBuffer
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

  private createBuffer() {
    this.cellIndicesBuffer = this.device.createBuffer({
      size: this.sphParams.particleCount * 4,
      usage:
        GPUBufferUsage.STORAGE |
        GPUBufferUsage.COPY_DST |
        GPUBufferUsage.COPY_SRC,
    });

    this.cellCountsBuffer = this.device.createBuffer({
      size: this.sphParams.totalCellCount * 4,
      usage:
        GPUBufferUsage.STORAGE |
        GPUBufferUsage.COPY_DST |
        GPUBufferUsage.COPY_SRC,
    });
    const cellCounts = new Uint32Array(this.sphParams.totalCellCount);
    cellCounts.fill(0);
    this.device.queue.writeBuffer(this.cellCountsBuffer, 0, cellCounts);
  }

  private makeBindGroup(): GPUBindGroup {
    return this.device.createBindGroup({
      layout: this.bindGroupLayout,
      entries: [
        {
          binding: 0,
          resource: { buffer: this.particles.getPositionBufferIn() },
        },
        {
          binding: 1,
          resource: { buffer: this.cellIndicesBuffer },
        },
        {
          binding: 2,
          resource: { buffer: this.cellCountsBuffer },
        },
        {
          binding: 3,
          resource: { buffer: this.sphParams.getBufferPhysics() },
        },
        {
          binding: 4,
          resource: { buffer: this.sphParams.getBufferSpatial() },
        },
      ],
    });
  }

  buildIndex(encoder: GPUCommandEncoder) {
    const pass = encoder.beginComputePass();
    pass.setPipeline(this.pipeline);
    pass.setBindGroup(0, this.makeBindGroup());
    pass.dispatchWorkgroups(Math.ceil(this.sphParams.particleCount / 64));
    pass.end();
  }

  getCellCountsBuffer() {
    return this.cellCountsBuffer;
  }

  getCellIndicesBuffer() {
    return this.cellIndicesBuffer;
  }

  resetCellCounts() {
    const cellCounts = new Uint32Array(this.sphParams.totalCellCount);
    cellCounts.fill(0);
    this.device.queue.writeBuffer(this.cellCountsBuffer, 0, cellCounts);
  }

  resetSimulation() {
    this.destroy();
    this.init();
  }

  destroy() {
    this.cellIndicesBuffer.destroy();
    this.cellCountsBuffer.destroy();
  }
}
