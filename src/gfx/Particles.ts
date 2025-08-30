import { SphParams } from "../compute/sph/SphParams";

export class Particles {
  private device: GPUDevice;
  private positions!: Float32Array;
  private velocities!: Float32Array;
  private sphParams: SphParams;

  private positionBufferIn!: GPUBuffer;
  private positionBufferOut!: GPUBuffer;
  private velocityBufferIn!: GPUBuffer;
  private velocityBufferOut!: GPUBuffer;

  constructor(device: GPUDevice, sphParams: SphParams) {
    this.device = device;
    this.sphParams = sphParams;
    this.init();
  }

  private init() {
    this.createParticlePositions();
    this.createBuffer();
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

  dispose() {
    this.positionBufferIn.destroy();
    this.velocityBufferIn.destroy();
    this.positionBufferOut.destroy();
    this.velocityBufferOut.destroy();
  }
}
