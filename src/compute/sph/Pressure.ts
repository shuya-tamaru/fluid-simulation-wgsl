import { Particles } from "../../gfx/Particles";
import pressureShader from "../../shaders/pressure.wgsl";
import { Density } from "./Density";
import { SphParams } from "./SphParams";

export class Pressure {
  private device: GPUDevice;
  private particles!: Particles;
  private sphParams!: SphParams;
  private density!: Density;
  private pressureBuffer!: GPUBuffer;

  private pipeline!: GPUComputePipeline;
  private bindGroupLayout!: GPUBindGroupLayout;

  constructor(
    device: GPUDevice,
    particles: Particles,
    sphParams: SphParams,
    density: Density
  ) {
    this.device = device;
    this.particles = particles;
    this.sphParams = sphParams;
    this.density = density;
    this.init();
  }

  init() {
    this.createBuffer();
    this.createBufferLayout();
  }

  private createBuffer() {
    this.pressureBuffer = this.device.createBuffer({
      size: this.sphParams.particleCount * 4,
      usage:
        GPUBufferUsage.STORAGE |
        GPUBufferUsage.COPY_DST |
        GPUBufferUsage.COPY_SRC,
    });
  }

  private createBufferLayout() {
    const module = this.device.createShaderModule({
      code: pressureShader,
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
          buffer: { type: "storage" }, // pressureBuffer
        },
        {
          binding: 3,
          visibility: GPUShaderStage.COMPUTE,
          buffer: { type: "uniform" }, // spatialParams
        },
        {
          binding: 4,
          visibility: GPUShaderStage.COMPUTE,
          buffer: { type: "uniform" }, // physicsParams
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
          resource: { buffer: this.density.getDensityBuffer() },
        },
        {
          binding: 2,
          resource: { buffer: this.pressureBuffer },
        },
        {
          binding: 3,
          resource: { buffer: this.sphParams.getBufferSpatial() },
        },
        {
          binding: 4,
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

  getPressureBuffer() {
    return this.pressureBuffer;
  }

  destroy() {
    this.pressureBuffer.destroy();
  }
}
