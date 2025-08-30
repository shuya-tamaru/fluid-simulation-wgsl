import { mat4 } from "gl-matrix";

export class TransformSystem {
  private buffer: GPUBuffer;
  private device: GPUDevice;

  public model = mat4.create();
  public view = mat4.create();
  public proj = mat4.create();

  constructor(device: GPUDevice) {
    this.buffer = device.createBuffer({
      size: 64 * 3,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });
    this.device = device;
  }

  setPerspective(fovRad: number, aspect: number, near: number, far: number) {
    mat4.perspective(this.proj, fovRad, aspect, near, far);
  }
  setModel(m: mat4) {
    mat4.copy(this.model, m);
  }
  setView(m: mat4) {
    mat4.copy(this.view, m);
  }

  update() {
    this.device.queue.writeBuffer(
      this.buffer,
      0,
      new Float32Array(this.model).buffer
    );
    this.device.queue.writeBuffer(
      this.buffer,
      64,
      new Float32Array(this.view).buffer
    );
    this.device.queue.writeBuffer(
      this.buffer,
      128,
      new Float32Array(this.proj).buffer
    );
  }

  getBuffer() {
    return this.buffer;
  }

  dispose() {
    this.buffer.destroy();
  }
}
