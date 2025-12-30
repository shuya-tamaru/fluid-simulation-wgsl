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

function showWebGPUError() {
  const errorElement = document.getElementById("webgpu-error");
  const canvas = document.querySelector<HTMLCanvasElement>("#app");

  if (errorElement) {
    errorElement.style.display = "flex";
  }
  if (canvas) {
    canvas.style.display = "none";
  }
}

function isMobile(): boolean {
  // タッチデバイスの検出
  const hasTouchScreen =
    "ontouchstart" in window || navigator.maxTouchPoints > 0;

  // User-Agentベースの検出
  const userAgent = navigator.userAgent.toLowerCase();
  const isMobileUA =
    /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(
      userAgent
    );

  // 画面サイズベースの検出（補助的な判断）
  const isSmallScreen = window.innerWidth <= 768;

  return hasTouchScreen && (isMobileUA || isSmallScreen);
}

export async function bootstrap() {
  //canvas
  const canvas = document.querySelector<HTMLCanvasElement>("#app");
  if (!canvas) {
    showWebGPUError();
    return;
  }
  sizeCanvas(canvas);

  // モバイルデバイスの検出
  const mobile = isMobile();
  if (mobile) {
    console.log("Mobile device detected");
  }

  // WebGPUの事前チェック
  if (!navigator.gpu) {
    console.error("WebGPU is not supported: navigator.gpu is not available");
    showWebGPUError();
    return;
  }

  // モバイルデバイスでは、より厳密にWebGPUの動作確認
  if (mobile) {
    try {
      const testAdapter = await navigator.gpu.requestAdapter();
      if (!testAdapter) {
        console.error(
          "WebGPU adapter not available on mobile: requestAdapter returned null"
        );
        showWebGPUError();
        return;
      }

      // さらに、実際にデバイスを取得できるかテスト
      try {
        const testDevice = await testAdapter.requestDevice();
        testDevice.destroy(); // テスト用デバイスは破棄
      } catch (error) {
        console.error("WebGPU device request failed on mobile:", error);
        showWebGPUError();
        return;
      }
    } catch (error) {
      console.error("WebGPU adapter request failed on mobile:", error);
      showWebGPUError();
      return;
    }
  }

  try {
    //initialize device
    const { device, context, format } = await Device.init(canvas);

    //params
    const trans = new TransformSystem(device);
    const params = new SphParams(device, 32, 16, 16, 10000);

    //assets
    const { wireBox, particles, timeStep } = createAssets(
      device,
      format,
      trans,
      params
    );

    //compute
    const simulator = new SphSimulator(device, params, particles, timeStep);

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

    //requestAnimationFrame
    const loop = () => {
      stats?.begin();

      const dt = 1 / 60;
      timeStep.set(dt);
      renderer.update();
      renderer.render();

      stats?.end();
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  } catch (error) {
    console.error("WebGPU initialization failed:", error);
    // エラーの詳細をログに出力
    if (error instanceof Error) {
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    }
    showWebGPUError();
  }
}
