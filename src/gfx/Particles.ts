import { SphParams } from "../compute/sph/SphParams";
import type { SphereInstance } from "./SphereInstance";
import particleShader from "../shaders/particleShader.wgsl";
import { TransformSystem } from "../utils/TransformSystem";

export class Particles {
  private device: GPUDevice;
  private format: GPUTextureFormat;

  private positions!: Float32Array;
  private velocities!: Float32Array;
  private sphParams: SphParams;
  private trans: TransformSystem;
  private pipeline!: GPURenderPipeline;
  private bindGroupLayout!: GPUBindGroupLayout;
  private sphereInstance!: SphereInstance;
  private positionBufferIn!: GPUBuffer;
  private positionBufferOut!: GPUBuffer;
  private velocityBufferIn!: GPUBuffer;
  private velocityBufferOut!: GPUBuffer;

  constructor(
    device: GPUDevice,
    format: GPUTextureFormat,
    trans: TransformSystem,
    sphParams: SphParams,
    sphereInstance: SphereInstance
  ) {
    this.device = device;
    this.format = format;
    this.trans = trans;
    this.sphParams = sphParams;
    this.sphereInstance = sphereInstance;
    this.init();
  }

  private init() {
    this.createParticlePositions();
    this.createBuffer();
    this.createPipeline();
  }

  private createPipeline() {
    this.bindGroupLayout = this.device.createBindGroupLayout({
      entries: [
        {
          binding: 0,
          visibility: GPUShaderStage.VERTEX,
          buffer: { type: "uniform" }, //transformParams
        },
        {
          binding: 1,
          visibility: GPUShaderStage.VERTEX,
          buffer: { type: "read-only-storage" }, //position
        },
        {
          binding: 2,
          visibility: GPUShaderStage.VERTEX,
          buffer: { type: "read-only-storage" }, //velocity
        },
      ],
    });

    const pipelineLayout = this.device.createPipelineLayout({
      bindGroupLayouts: [this.bindGroupLayout],
    });

    this.pipeline = this.device.createRenderPipeline({
      vertex: {
        module: this.device.createShaderModule({ code: particleShader }),
        entryPoint: "vs_main",
        buffers: [this.sphereInstance.getVertexBufferLayout()],
      },
      fragment: {
        module: this.device.createShaderModule({ code: particleShader }),
        entryPoint: "fs_main",
        targets: [{ format: this.format }],
      },
      primitive: {
        topology: "triangle-list",
      },
      depthStencil: {
        depthWriteEnabled: true,
        depthCompare: "less",
        format: "depth24plus",
      },
      layout: pipelineLayout,
    });
  }

  private createParticlePositions() {
    this.positions = new Float32Array(this.sphParams.particleCount * 4);
    this.velocities = new Float32Array(this.sphParams.particleCount * 4);

    for (let i = 0; i < this.sphParams.particleCount; i++) {
      this.positions[i * 4 + 0] =
        (Math.random() - 0.5) * this.sphParams.boxWidth;
      this.positions[i * 4 + 1] =
        (Math.random() - 0.5) * this.sphParams.boxHeight;
      this.positions[i * 4 + 2] =
        (Math.random() - 0.5) * this.sphParams.boxDepth;
      this.positions[i * 4 + 3] = 0.0;
    }
  }

  private createBuffer() {
    const usage =
      GPUBufferUsage.COPY_DST |
      GPUBufferUsage.STORAGE |
      GPUBufferUsage.COPY_SRC;

    this.positionBufferIn = this.device.createBuffer({
      size: this.positions.byteLength,
      usage,
      mappedAtCreation: true,
    });
    new Float32Array(this.positionBufferIn.getMappedRange()).set(
      this.positions
    );
    this.positionBufferIn.unmap();

    this.velocityBufferIn = this.device.createBuffer({
      size: this.velocities.byteLength,
      usage,
      mappedAtCreation: true,
    });
    new Float32Array(this.velocityBufferIn.getMappedRange()).set(
      this.velocities.fill(0)
    );
    this.velocityBufferIn.unmap();

    this.positionBufferOut = this.device.createBuffer({
      size: this.positions.byteLength,
      usage,
      mappedAtCreation: true,
    });
    this.positionBufferOut.unmap();

    this.velocityBufferOut = this.device.createBuffer({
      size: this.velocities.byteLength,
      usage,
      mappedAtCreation: true,
    });
    this.velocityBufferOut.unmap();
  }

  getPositionBufferIn() {
    return this.positionBufferIn;
  }

  getVelocityBufferIn() {
    return this.velocityBufferIn;
  }

  getPositionBufferOut() {
    return this.positionBufferOut;
  }

  getVelocityBufferOut() {
    return this.velocityBufferOut;
  }

  private makeBindGroup(): GPUBindGroup {
    return this.device.createBindGroup({
      layout: this.bindGroupLayout,
      entries: [
        {
          binding: 0,
          resource: { buffer: this.trans.getBuffer() },
        },
        {
          binding: 1,
          resource: { buffer: this.positionBufferIn },
        },
        {
          binding: 2,
          resource: { buffer: this.velocityBufferIn },
        },
      ],
    });
  }

  draw(pass: GPURenderPassEncoder) {
    pass.setPipeline(this.pipeline);
    pass.setBindGroup(0, this.makeBindGroup());
    pass.setVertexBuffer(0, this.sphereInstance.getVertexBuffer());
    pass.setIndexBuffer(this.sphereInstance.getIndexBuffer(), "uint16");
    pass.drawIndexed(
      this.sphereInstance.getIndexCount(),
      this.sphParams.particleCount
    );
  }

  dispose() {
    this.positionBufferIn.destroy();
    this.velocityBufferIn.destroy();
    this.positionBufferOut.destroy();
    this.velocityBufferOut.destroy();
  }
}
