import { Particles } from "../../gfx/Particles";
import viscosityShader from "../../shaders/viscosity.wgsl";
import { Density } from "./Density";
import { GridCell } from "./GridCell";
import { SphParams } from "./SphParams";
import { StartGridIndices } from "./StartGridIndices";

export class Viscosity {
  private device: GPUDevice;
  private particles!: Particles;
  private sphParams!: SphParams;
  private density!: Density;
  private gridCell!: GridCell;
  private startGridIndices!: StartGridIndices;

  private viscosityBuffer!: GPUBuffer;
  private pipeline!: GPUComputePipeline;
  private bindGroupLayout!: GPUBindGroupLayout;

  constructor(
    device: GPUDevice,
    particles: Particles,
    sphParams: SphParams,
    density: Density,
    gridCell: GridCell,
    startGridIndices: StartGridIndices
  ) {
    this.device = device;
    this.particles = particles;
    this.sphParams = sphParams;
    this.density = density;
    this.gridCell = gridCell;
    this.startGridIndices = startGridIndices;
    this.init();
  }
  init() {
    this.createBuffer();
    this.createBufferLayout();
  }
  createBuffer() {
    this.viscosityBuffer = this.device.createBuffer({
      size: this.sphParams.particleCount * 4 * 4,
      usage:
        GPUBufferUsage.STORAGE |
        GPUBufferUsage.COPY_DST |
        GPUBufferUsage.COPY_SRC,
    });
  }
  createBufferLayout() {
    const module = this.device.createShaderModule({
      code: viscosityShader,
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
          buffer: { type: "read-only-storage" }, // velocitiesBuffer
        },
        {
          binding: 2,
          visibility: GPUShaderStage.COMPUTE,
          buffer: { type: "read-only-storage" }, // densityBuffer
        },
        {
          binding: 3,
          visibility: GPUShaderStage.COMPUTE,
          buffer: { type: "read-only-storage" },
        }, // cellStart
        {
          binding: 4,
          visibility: GPUShaderStage.COMPUTE,
          buffer: { type: "read-only-storage" },
        }, // cellCounts
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
          buffer: { type: "storage" }, // viscosityBuffer
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
        {
          binding: 1,
          resource: { buffer: this.particles.getVelocityBufferIn() },
        },

        {
          binding: 2,
          resource: { buffer: this.density.getDensityBuffer() },
        },
        {
          binding: 3,
          resource: {
            buffer: this.startGridIndices.getCellStartIndicesBuffer(),
          },
        },
        {
          binding: 4,
          resource: { buffer: this.gridCell.getCellCountsBuffer() },
        },
        {
          binding: 5,
          resource: { buffer: this.sphParams.getBufferSpatial() },
        },
        {
          binding: 6,
          resource: { buffer: this.sphParams.getBufferPhysics() },
        },
        {
          binding: 7,
          resource: { buffer: this.viscosityBuffer },
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

  getViscosityBuffer() {
    return this.viscosityBuffer;
  }

  destroy() {
    this.viscosityBuffer.destroy();
  }
}
