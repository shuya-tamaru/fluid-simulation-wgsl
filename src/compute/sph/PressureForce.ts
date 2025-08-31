import pressureForceShader from "../../shaders/pressureForce.wgsl";
import { Density } from "./Density";
import { Pressure } from "./Pressure";
import { GridCell } from "./GridCell";
import { StartGridIndices } from "./StartGridIndices";
import { Particles } from "../../gfx/Particles";
import { SphParams } from "./SphParams";

export class PressureForce {
  private device: GPUDevice;
  private density!: Density;
  private pressure!: Pressure;
  private gridCell!: GridCell;
  private startGridIndices!: StartGridIndices;
  private particles!: Particles;
  private sphParams!: SphParams;

  private pressureForceBuffer!: GPUBuffer;

  private pipeline!: GPUComputePipeline;
  private bindGroupLayout!: GPUBindGroupLayout;

  constructor(
    device: GPUDevice,
    particles: Particles,
    density: Density,
    pressure: Pressure,
    gridCell: GridCell,
    startGridIndices: StartGridIndices,
    sphParams: SphParams
  ) {
    this.device = device;
    this.particles = particles;
    this.density = density;
    this.pressure = pressure;
    this.gridCell = gridCell;
    this.startGridIndices = startGridIndices;
    this.sphParams = sphParams;
    this.init();
  }

  init() {
    this.createBuffer();
    this.createBufferLayout();
  }

  createBuffer() {
    this.pressureForceBuffer = this.device.createBuffer({
      size: this.sphParams.particleCount * 4 * 4,
      usage:
        GPUBufferUsage.STORAGE |
        GPUBufferUsage.COPY_DST |
        GPUBufferUsage.COPY_SRC,
    });
  }

  createBufferLayout() {
    const module = this.device.createShaderModule({
      code: pressureForceShader,
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
          buffer: { type: "read-only-storage" }, // densityBuffer
        },
        {
          binding: 2,
          visibility: GPUShaderStage.COMPUTE,
          buffer: { type: "read-only-storage" }, // cellStart
        },
        {
          binding: 3,
          visibility: GPUShaderStage.COMPUTE,
          buffer: { type: "read-only-storage" }, // cellCounts
        },
        {
          binding: 4,
          visibility: GPUShaderStage.COMPUTE,
          buffer: { type: "read-only-storage" }, // pressureBuffer
        },
        {
          binding: 5,
          visibility: GPUShaderStage.COMPUTE,
          buffer: { type: "uniform" }, // spatialParams
        },
        {
          binding: 6,
          visibility: GPUShaderStage.COMPUTE,
          buffer: { type: "uniform" }, // physicsParams
        },
        {
          binding: 7,
          visibility: GPUShaderStage.COMPUTE,
          buffer: { type: "storage" }, // pressureForceBuffer
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
          resource: { buffer: this.particles.getPositionBufferIn() },
        },
        { binding: 1, resource: { buffer: this.density.getDensityBuffer() } },
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
        { binding: 4, resource: { buffer: this.pressure.getPressureBuffer() } },
        { binding: 5, resource: { buffer: this.sphParams.getBufferSpatial() } },
        { binding: 6, resource: { buffer: this.sphParams.getBufferPhysics() } },
        { binding: 7, resource: { buffer: this.pressureForceBuffer } },
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

  getPressureForceBuffer() {
    return this.pressureForceBuffer;
  }

  destroy() {
    this.pressureForceBuffer.destroy();
  }
}
