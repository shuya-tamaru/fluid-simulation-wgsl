import Stats from "stats.js";
import { Device } from "../core/Device";
import { Renderer } from "../core/Renderer";
import { attachResize, sizeCanvas } from "./resize";
import { SphParams } from "../compute/sph/SphParams";
import { TransformSystem } from "../utils/TransformSystem";
import { FluidScene } from "../scenes/FluidScene";
import { FluidGui } from "../utils/FluidGui";
import { createAssets } from "../scenes/createAssets";
import { SphSimulator } from "../compute/sph/SphSimulator";

export async function bootstrap() {
  //canvas
  const canvas = document.querySelector<HTMLCanvasElement>("#app");
  if (!canvas) throw new Error("canvas not found");
  sizeCanvas(canvas);

  //initialize device
  const { device, context, format } = await Device.init(canvas);

  //params
  const trans = new TransformSystem(device);
  const params = new SphParams(device, 32, 4, 16, 10000);

  //assets
  const { wireBox, particles } = createAssets(device, format, trans, params);

  //compute
  const simulator = new SphSimulator(device, params, particles);

  //scene
  const scene = new FluidScene(wireBox, particles);

  //gui
  new FluidGui(scene, params, simulator);

  //renderer
  const renderer = new Renderer(
    device,
    context,
    canvas,
    scene,
    simulator,
    trans
  );

  await renderer.init();

  //resize
  attachResize(canvas, (w, h) => {
    renderer.onResize(w, h);
  });

  // stats
  const stats = new Stats();
  stats.showPanel(0);
  document.body.appendChild(stats.dom);
  let last = performance.now();

  //requestAnimationFrame
  const loop = (t: number) => {
    stats?.begin();

    const dt = (t - last) * 0.001;
    last = t;
    renderer.update(dt);
    renderer.render();

    stats?.end();
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
}
