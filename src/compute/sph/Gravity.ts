import { Particles } from "../../gfx/Particles";
import gravityShader from "../../shaders/gravity.wgsl";
import { TimeStep } from "../../utils/TimeStep";
import { SphParams } from "./SphParams";

export class Gravity {
  private device: GPUDevice;
  private sphParams!: SphParams;
  private particles!: Particles;
  private timeStep!: TimeStep;

  private pipeline!: GPUComputePipeline;
  private bindGroupLayout!: GPUBindGroupLayout; // ← layout は固定で持つ

  constructor(
    device: GPUDevice,
    sphParams: SphParams,
    timeStep: TimeStep,
    particles: Particles
  ) {
    this.device = device;
    this.sphParams = sphParams;
    this.timeStep = timeStep;
    this.particles = particles;
    this.init();
  }

  init() {
    this.createBufferLayout();
  }

  createBufferLayout() {
    const module = this.device.createShaderModule({
      code: gravityShader,
    });

    this.bindGroupLayout = this.device.createBindGroupLayout({
      entries: [
        {
          binding: 0,
          visibility: GPUShaderStage.COMPUTE,
          buffer: { type: "storage" }, // positionsBuffer
        },
        {
          binding: 1,
          visibility: GPUShaderStage.COMPUTE,
          buffer: { type: "storage" }, // velocitiesBuffer
        },
        {
          binding: 2,
          visibility: GPUShaderStage.COMPUTE,
          buffer: { type: "uniform" }, // timeStepBuffer
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
          resource: { buffer: this.particles.getVelocityBufferIn() },
        },
        { binding: 2, resource: { buffer: this.timeStep.getBuffer() } },
        { binding: 3, resource: { buffer: this.sphParams.getBufferSpatial() } },
        { binding: 4, resource: { buffer: this.sphParams.getBufferPhysics() } },
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
