import { mat4 } from "gl-matrix";
import { TransformSystem } from "../utils/TransformSystem";
import { OrbitCamera } from "./OrbitCamera";
import { FluidScene } from "../scenes/FluidScene";
import { SphSimulator } from "../compute/sph/SphSimulator";
import { debugReadBuffer } from "../utils/debugReadBuffer";

export class Renderer {
  private device: GPUDevice;
  private context: GPUCanvasContext;
  private format: GPUTextureFormat;
  private transformMatrix: TransformSystem;

  private pipeline!: GPURenderPipeline;
  private depth!: GPUTexture;
  private orbit!: OrbitCamera;
  private scene!: FluidScene;
  private simulator!: SphSimulator;
  private cameraParams = {
    fov: Math.PI / 2,
    near: 0.1,
    far: 500,
    lookAt: [2.5, 2.0, 3.2],
    target: [0, 0, 0],
    up: [0, 1, 0],
    distance: 25,
    theta: Math.PI / 2,
    phi: Math.PI / 2,
  };

  constructor(
    device: GPUDevice,
    context: GPUCanvasContext,
    format: GPUTextureFormat,
    canvas: HTMLCanvasElement,
    scene: FluidScene,
    simulator: SphSimulator,
    trans: TransformSystem
  ) {
    this.device = device;
    this.context = context;
    this.scene = scene;
    this.simulator = simulator;
    this.transformMatrix = trans;
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
    const canvasView = this.context.getCurrentTexture().createView();

    this.simulator.compute(encoder);

    const pass = encoder.beginRenderPass({
      colorAttachments: [
        {
          view: canvasView,
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

    this.scene.draw(pass);
    pass.end();
    this.device.queue.submit([encoder.finish()]);

    //debug
    // this.debug(
    //   this.simulator.getInstance().gridCell.getCellCountsBuffer(),
    //   "uint32"
    // );
  }

  debug(buffer: GPUBuffer, type: "uint32" | "float32") {
    this.device.queue
      .onSubmittedWorkDone()
      .then(() => debugReadBuffer(this.device, buffer, buffer.size))
      .then((data) => {
        const dataView = new (type === "uint32" ? Uint32Array : Float32Array)(
          data
        );
        console.log(dataView);
      });
  }
}
