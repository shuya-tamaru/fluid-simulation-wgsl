import { PressureForce } from "./PressureForce";
import integrateShader from "../../shaders/integrate.wgsl";
import { Viscosity } from "./Viscosity";
import { Particles } from "../../gfx/Particles";
import { TimeStep } from "../../utils/TimeStep";
import { SphParams } from "./SphParams";

export class Integrate {
  private device: GPUDevice;
  private pressureForce!: PressureForce;
  private particles!: Particles;
  private sphParams!: SphParams;
  private viscosity!: Viscosity;
  private timeStep!: TimeStep;

  private pipeline!: GPUComputePipeline;
  private bindGroupLayout!: GPUBindGroupLayout;

  constructor(
    device: GPUDevice,
    particles: Particles,
    sphParams: SphParams,
    pressureForce: PressureForce,
    viscosity: Viscosity,
    timeStep: TimeStep
  ) {
    this.device = device;
    this.particles = particles;
    this.sphParams = sphParams;
    this.pressureForce = pressureForce;
    this.viscosity = viscosity;
    this.timeStep = timeStep;
    this.init();
  }

  init() {
    this.createBufferLayout();
  }

  private createBufferLayout() {
    const module = this.device.createShaderModule({
      code: integrateShader,
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
          buffer: { type: "read-only-storage" }, // pressureForcesBuffer
        },
        {
          binding: 3,
          visibility: GPUShaderStage.COMPUTE,
          buffer: { type: "read-only-storage" }, // viscositiesBuffer
        },
        {
          binding: 4,
          visibility: GPUShaderStage.COMPUTE,
          buffer: { type: "uniform" }, // spatialParamsBuffer
        },
        {
          binding: 5,
          visibility: GPUShaderStage.COMPUTE,
          buffer: { type: "uniform" }, // physicsParamsBuffer
        },
        {
          binding: 6,
          visibility: GPUShaderStage.COMPUTE,
          buffer: { type: "uniform" }, // timeStepBufferBuffer
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
        { binding: 0, resource: this.particles.getPositionBufferIn() },
        { binding: 1, resource: this.particles.getVelocityBufferIn() },
        { binding: 2, resource: this.pressureForce.getPressureForceBuffer() },
        { binding: 3, resource: this.viscosity.getViscosityBuffer() },
        { binding: 4, resource: this.sphParams.getBufferSpatial() },
        { binding: 5, resource: this.sphParams.getBufferPhysics() },
        { binding: 6, resource: this.timeStep.getBuffer() },
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
