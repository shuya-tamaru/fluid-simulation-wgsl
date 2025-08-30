import Stats from "stats.js";
import { Device } from "../core/Device";
import { Renderer } from "../core/Renderer";
import { attachResize, sizeCanvas } from "./resize";

export async function bootstrap() {
  const canvas = document.querySelector<HTMLCanvasElement>("#app");
  if (!canvas) throw new Error("canvas not found");

  sizeCanvas(canvas);

  const { device, context, format } = await Device.init(canvas);
  const renderer = new Renderer(device, context, format, canvas);
  await renderer.init();

  attachResize(canvas, (w, h) => {
    renderer.onResize(w, h);
  });

  const stats = new Stats();
  stats.showPanel(0);
  document.body.appendChild(stats.dom);
  let last = performance.now();

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
