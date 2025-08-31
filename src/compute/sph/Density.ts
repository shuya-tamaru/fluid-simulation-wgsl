import { Particles } from "../../gfx/Particles";
import densityShader from "../../shaders/density.wgsl";
import { GridCell } from "./GridCell";
import { SphParams } from "./SphParams";
import { StartGridIndices } from "./StartGridIndices";

export class Density {
  private device: GPUDevice;
  private sphParams: SphParams;
  private particles: Particles;

  private gridCell: GridCell;
  private startGridIndices: StartGridIndices;

  private densityBuffer!: GPUBuffer;
  private pipeline!: GPUComputePipeline;
  private bindGroupLayout!: GPUBindGroupLayout; // ← layout は固定で持つ

  constructor(
    device: GPUDevice,
    sphParams: SphParams,
    particles: Particles,
    gridCell: GridCell,
    startGridIndices: StartGridIndices
  ) {
    this.device = device;
    this.sphParams = sphParams;
    this.particles = particles;
    this.gridCell = gridCell;
    this.startGridIndices = startGridIndices;

    this.init();
  }

  init() {
    this.createBufferLayout();
    this.createBuffer();
  }

  createBuffer() {
    const bytes = this.sphParams.particleCount * 4;
    this.densityBuffer = this.device.createBuffer({
      size: bytes,
      usage:
        GPUBufferUsage.STORAGE |
        GPUBufferUsage.COPY_DST |
        GPUBufferUsage.COPY_SRC,
      label: "densityBuffer",
    });
  }

  createBufferLayout() {
    const module = this.device.createShaderModule({ code: densityShader });
    // layout は固定でOK
    this.bindGroupLayout = this.device.createBindGroupLayout({
      entries: [
        {
          binding: 0,
          visibility: GPUShaderStage.COMPUTE,
          buffer: { type: "read-only-storage" },
        }, // positions (In)
        {
          binding: 1,
          visibility: GPUShaderStage.COMPUTE,
          buffer: { type: "storage" },
        }, // densities (RW)
        {
          binding: 2,
          visibility: GPUShaderStage.COMPUTE,
          buffer: { type: "read-only-storage" },
        }, // cellStart
        {
          binding: 3,
          visibility: GPUShaderStage.COMPUTE,
          buffer: { type: "read-only-storage" },
        }, // cellCounts
        {
          binding: 4,
          visibility: GPUShaderStage.COMPUTE,
          buffer: { type: "uniform" },
        }, // spatialParams
        {
          binding: 5,
          visibility: GPUShaderStage.COMPUTE,
          buffer: { type: "uniform" },
        }, // physicsParams
      ],
    });

    this.pipeline = this.device.createComputePipeline({
      layout: this.device.createPipelineLayout({
        bindGroupLayouts: [this.bindGroupLayout],
      }),
      compute: { module, entryPoint: "cs_main" },
    });
  }

  // ★ 毎フレーム“今の In”で bindGroup を作る
  private makeBindGroup(): GPUBindGroup {
    return this.device.createBindGroup({
      layout: this.bindGroupLayout,
      entries: [
        {
          binding: 0,
          resource: { buffer: this.particles.getPositionBufferIn() },
        }, // ← swap 後の In
        { binding: 1, resource: { buffer: this.densityBuffer } },
        {
          binding: 2,
          resource: {
            buffer: this.startGridIndices.getCellStartIndicesBuffer(),
          },
        },
        {
          binding: 3,
          resource: { buffer: this.gridCell.getCellCountsBuffer() },
        },
        {
          binding: 4,
          resource: { buffer: this.sphParams.getBufferSpatial() },
        },
        {
          binding: 5,
          resource: { buffer: this.sphParams.getBufferPhysics() },
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

  getDensityBuffer() {
    return this.densityBuffer;
  }

  destroy() {
    this.densityBuffer.destroy?.();
  }
}
