import swapShader from "../../shaders/pingPong.wgsl";
import { SphParams } from "./SphParams";
import { Particles } from "../../gfx/Particles";

export class ParticlePingPong {
  private device: GPUDevice;
  private sphParams: SphParams;
  private particles!: Particles;

  private pipeline!: GPUComputePipeline;
  private bindGroupLayout!: GPUBindGroupLayout;

  constructor(device: GPUDevice, sphParams: SphParams, particles: Particles) {
    this.device = device;
    this.sphParams = sphParams;
    this.particles = particles;
    this.init();
  }

  private init() {
    this.createBufferLayout();
  }

  createBufferLayout() {
    const module = this.device.createShaderModule({
      code: swapShader,
    });
    this.bindGroupLayout = this.device.createBindGroupLayout({
      entries: [
        {
          binding: 0,
          visibility: GPUShaderStage.COMPUTE,
          buffer: { type: "read-only-storage" }, // positionsBufferOut
        },
        {
          binding: 1,
          visibility: GPUShaderStage.COMPUTE,
          buffer: { type: "read-only-storage" }, // velocitiesBufferOut
        },
        {
          binding: 2,
          visibility: GPUShaderStage.COMPUTE,
          buffer: { type: "storage" }, // positionsBufferIn
        },
        {
          binding: 3,
          visibility: GPUShaderStage.COMPUTE,
          buffer: { type: "storage" }, // velocitiesBufferIn
        },
        {
          binding: 4,
          visibility: GPUShaderStage.COMPUTE,
          buffer: { type: "uniform" }, // spatialParams
        },
      ],
    });

    const pipelineLayout = this.device.createPipelineLayout({
      bindGroupLayouts: [this.bindGroupLayout],
    });

    this.pipeline = this.device.createComputePipeline({
      layout: pipelineLayout,
      compute: {
        module: module,
        entryPoint: "cs_main",
      },
    });
  }

  private makeBindGroup(): GPUBindGroup {
    return this.device.createBindGroup({
      layout: this.bindGroupLayout,
      entries: [
        {
          binding: 0,
          resource: { buffer: this.particles.getPositionBufferOut() },
        },
        {
          binding: 1,
          resource: { buffer: this.particles.getVelocityBufferOut() },
        },
        {
          binding: 2,
          resource: { buffer: this.particles.getPositionBufferIn() },
        },
        {
          binding: 3,
          resource: { buffer: this.particles.getVelocityBufferIn() },
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
}
