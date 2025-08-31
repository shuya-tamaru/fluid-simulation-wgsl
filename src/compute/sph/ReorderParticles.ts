import { Particles } from "../../gfx/Particles";
import reorderShader from "../../shaders/reorder.wgsl";
import { Scatter } from "./Scatter";
import { SphParams } from "./SphParams";

export class ReOrderParticles {
  private device: GPUDevice;
  private scatter: Scatter;
  private sphParams!: SphParams;
  private particles!: Particles;

  private pipeline!: GPUComputePipeline;
  private bindGroupLayout!: GPUBindGroupLayout;

  constructor(
    device: GPUDevice,
    sphParams: SphParams,
    scatter: Scatter,
    particles: Particles
  ) {
    this.device = device;
    this.sphParams = sphParams;
    this.scatter = scatter;
    this.particles = particles;
    this.init();
  }

  init() {
    this.createBufferLayout();
  }

  createBufferLayout() {
    const module = this.device.createShaderModule({
      code: reorderShader,
    });

    this.bindGroupLayout = this.device.createBindGroupLayout({
      entries: [
        {
          binding: 0,
          visibility: GPUShaderStage.COMPUTE,
          buffer: { type: "read-only-storage" }, // positionsBufferIn
        },
        {
          binding: 1,
          visibility: GPUShaderStage.COMPUTE,
          buffer: { type: "read-only-storage" }, // velocitiesBufferIn
        },
        {
          binding: 2,
          visibility: GPUShaderStage.COMPUTE,
          buffer: { type: "storage" }, // positionsBufferOut
        },
        {
          binding: 3,
          visibility: GPUShaderStage.COMPUTE,
          buffer: { type: "storage" }, // velocitiesBufferOut
        },
        {
          binding: 4,
          visibility: GPUShaderStage.COMPUTE,
          buffer: { type: "read-only-storage" }, // gridParticleIdsBuffer
        },
        {
          binding: 5,
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
          resource: { buffer: this.particles.getPositionBufferIn() },
        },
        {
          binding: 1,
          resource: { buffer: this.particles.getVelocityBufferIn() },
        },
        {
          binding: 2,
          resource: { buffer: this.particles.getPositionBufferOut() },
        },
        {
          binding: 3,
          resource: { buffer: this.particles.getVelocityBufferOut() },
        },
        {
          binding: 4,
          resource: { buffer: this.scatter.getGridParticleIdsBuffer() },
        },
        {
          binding: 5,
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
}
