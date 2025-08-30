import wireBoxSdader from "../shaders/wireBox.wgsl";
import { SphParams } from "../compute/sph/SphParams";
import { createGeometry } from "./createBoxGeometry";

export class WireBox {
  private device: GPUDevice;
  private format: GPUTextureFormat;
  private pipeline!: GPURenderPipeline;
  private vertexBuffer!: GPUBuffer;
  private indexBuffer!: GPUBuffer;
  private transformBuffer: GPUBuffer;
  private sphParams: SphParams;
  private bindGroup!: GPUBindGroup;
  private indexCount = 24;

  constructor(
    device: GPUDevice,
    format: GPUTextureFormat,
    transformBuffer: GPUBuffer,
    sphParams: SphParams
  ) {
    this.device = device;
    this.format = format;
    this.transformBuffer = transformBuffer;
    this.sphParams = sphParams;
    this.init();
  }

  private init() {
    const { vertices, indices } = createGeometry({
      w: this.sphParams.boxWidth,
      h: this.sphParams.boxHeight,
      d: this.sphParams.boxDepth,
    });

    this.vertexBuffer = this.device.createBuffer({
      size: vertices.byteLength,
      usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
    });
    this.indexBuffer = this.device.createBuffer({
      size: indices.byteLength,
      usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST,
    });
    this.device.queue.writeBuffer(this.vertexBuffer, 0, vertices);
    this.device.queue.writeBuffer(this.indexBuffer, 0, indices);

    this.indexCount = indices.length;

    this.createPipeline();
  }

  private createPipeline() {
    const shaderModule = this.device.createShaderModule({
      code: wireBoxSdader,
    });

    this.pipeline = this.device.createRenderPipeline({
      layout: "auto",
      vertex: {
        module: shaderModule,
        entryPoint: "vs_main",
        buffers: [
          {
            arrayStride: 16, // float32x4
            attributes: [{ shaderLocation: 0, offset: 0, format: "float32x4" }],
          },
        ],
      },
      fragment: {
        module: shaderModule,
        entryPoint: "fs_main",
        targets: [{ format: this.format }],
      },
      primitive: {
        topology: "line-list",
        cullMode: "none",
      },
      depthStencil: this.format
        ? {
            format: "depth24plus",
            depthCompare: "less",
            depthWriteEnabled: false,
          }
        : undefined,
    });
    this.bindGroup = this.device.createBindGroup({
      layout: this.pipeline.getBindGroupLayout(0),
      entries: [{ binding: 0, resource: { buffer: this.transformBuffer } }],
    });
  }

  setSize(size: { w: number; h: number; d: number }) {
    const { vertices, indices } = createGeometry(size);
    this.device.queue.writeBuffer(this.vertexBuffer, 0, vertices);
    this.device.queue.writeBuffer(this.indexBuffer, 0, indices);
  }

  draw(pass: GPURenderPassEncoder) {
    pass.setPipeline(this.pipeline);
    pass.setBindGroup(0, this.bindGroup);
    pass.setVertexBuffer(0, this.vertexBuffer);
    pass.setIndexBuffer(this.indexBuffer, "uint16");
    pass.drawIndexed(this.indexCount);
  }
}
