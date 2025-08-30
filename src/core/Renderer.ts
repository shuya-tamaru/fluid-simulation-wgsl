import { mat4 } from "gl-matrix";
import { createCubeGeometry } from "../gfx/createCubeGeometry";
import { TransformSystem } from "../utils/TransformSystem";
import cubeShader from "../shaders/cube.wgsl";
import { OrbitCamera } from "./OrbitCamera";

export class Renderer {
  private device: GPUDevice;
  private context: GPUCanvasContext;
  private format: GPUTextureFormat;
  private transformMatrix: TransformSystem;

  private pipeline!: GPURenderPipeline;
  private bindGroup!: GPUBindGroup;
  private depth!: GPUTexture;
  private orbit!: OrbitCamera;

  private vertex!: GPUBuffer;
  private index!: GPUBuffer;
  private indexCount = 0;
  private cameraParams = {
    fov: (45 * Math.PI) / 180,
    near: 0.1,
    far: 100,
    lookAt: [2.5, 2.0, 3.2],
    target: [0, 0, 0],
    up: [0, 1, 0],
    distance: 7,
    theta: Math.PI / 4,
    phi: Math.PI / 3,
  };

  constructor(
    device: GPUDevice,
    context: GPUCanvasContext,
    format: GPUTextureFormat,
    canvas: HTMLCanvasElement
  ) {
    this.device = device;
    this.context = context;
    this.transformMatrix = new TransformSystem(device);
    this.format = format;
    this.orbit = new OrbitCamera(canvas, {
      distance: this.cameraParams.distance,
      theta: this.cameraParams.theta,
      phi: this.cameraParams.phi,
    });
    this.init();
  }

  async init() {
    this.createDepth();

    const aspect =
      this.context.getCurrentTexture().width /
      this.context.getCurrentTexture().height;
    const view = mat4.create();
    mat4.lookAt(
      view,
      this.cameraParams.lookAt,
      this.cameraParams.target,
      this.cameraParams.up
    );
    this.transformMatrix.setView(view);
    this.transformMatrix.setPerspective(
      this.cameraParams.fov,
      aspect,
      this.cameraParams.near,
      this.cameraParams.far
    );
    this.transformMatrix.setModel(mat4.create());
    this.transformMatrix.update();

    const geo = createCubeGeometry(this.device);
    this.vertex = geo.vertexBuffer;
    this.index = geo.indexBuffer;
    this.indexCount = geo.indexCount;

    const module = this.device.createShaderModule({
      code: cubeShader,
    });

    this.pipeline = this.device.createRenderPipeline({
      layout: "auto",
      vertex: { module, entryPoint: "vs_main", buffers: [geo.layout] },
      fragment: {
        module,
        entryPoint: "fs_main",
        targets: [{ format: this.format }],
      },
      primitive: { topology: "triangle-list" },
      depthStencil: {
        format: "depth24plus",
        depthWriteEnabled: true,
        depthCompare: "less",
      },
    });

    this.bindGroup = this.device.createBindGroup({
      layout: this.pipeline.getBindGroupLayout(0),
      entries: [
        { binding: 0, resource: { buffer: this.transformMatrix.getBuffer() } },
      ],
    });
  }

  private createDepth() {
    const cur = this.context.getCurrentTexture();
    this.depth = this.device.createTexture({
      size: [cur.width, cur.height],
      format: "depth24plus",
      usage: GPUTextureUsage.RENDER_ATTACHMENT,
    });
  }

  private recreateDepth(w: number, h: number) {
    this.depth?.destroy?.();
    this.depth = this.device.createTexture({
      size: [w, h],
      format: "depth24plus",
      usage: GPUTextureUsage.RENDER_ATTACHMENT,
    });
  }

  update(dt: number) {
    this.transformMatrix.setView(this.orbit.getView());
    this.transformMatrix.update();
  }

  onResize(w: number, h: number) {
    this.recreateDepth(w, h);

    const aspect = w / h;
    this.transformMatrix.setPerspective(
      this.cameraParams.fov,
      aspect,
      this.cameraParams.near,
      this.cameraParams.far
    );
    this.transformMatrix.update();
    this.orbit.setFovY(this.cameraParams.fov);
  }

  render() {
    const encoder = this.device.createCommandEncoder();
    const pass = encoder.beginRenderPass({
      colorAttachments: [
        {
          view: this.context.getCurrentTexture().createView(),
          clearValue: { r: 0.05, g: 0.07, b: 0.1, a: 1.0 },
          loadOp: "clear",
          storeOp: "store",
        },
      ],
      depthStencilAttachment: {
        view: this.depth.createView(),
        depthClearValue: 1,
        depthLoadOp: "clear",
        depthStoreOp: "store",
      },
    });
    pass.setPipeline(this.pipeline);
    pass.setBindGroup(0, this.bindGroup);
    pass.setVertexBuffer(0, this.vertex);
    pass.setIndexBuffer(this.index, "uint16");
    pass.drawIndexed(this.indexCount);
    pass.end();
    this.device.queue.submit([encoder.finish()]);
  }
}
