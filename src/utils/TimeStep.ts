export class TimeStep {
  private device: GPUDevice;
  private buffer: GPUBuffer;

  constructor(device: GPUDevice) {
    this.device = device;
    this.buffer = device.createBuffer({
      size: 16,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });
  }

  set(value: number) {
    this.device.queue.writeBuffer(
      this.buffer,
      0,
      new Float32Array([value, 0, 0, 0])
    );
  }

  getBuffer() {
    return this.buffer;
  }
}
