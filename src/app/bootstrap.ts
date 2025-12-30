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

function showWebGPUError(debugInfo?: string) {
  const errorElement = document.getElementById("webgpu-error");
  const canvas = document.querySelector<HTMLCanvasElement>("#app");
  const debugElement = document.getElementById("debug-info");

  if (errorElement) {
    errorElement.style.display = "flex";
  }
  if (canvas) {
    canvas.style.display = "none";
  }
  if (debugElement && debugInfo) {
    debugElement.textContent = debugInfo;
    debugElement.style.display = "block";
  }
}

function collectDebugInfo(error?: Error | unknown): string {
  const info: string[] = [];

  // 基本情報
  info.push("=== デバッグ情報 ===");
  info.push(`User Agent: ${navigator.userAgent}`);
  info.push(`Platform: ${navigator.platform}`);
  info.push(`Vendor: ${navigator.vendor}`);
  info.push(`Screen: ${window.screen.width}x${window.screen.height}`);
  info.push(`Window: ${window.innerWidth}x${window.innerHeight}`);

  // モバイル検出
  const mobile = isMobile();
  info.push(`Mobile Detected: ${mobile ? "Yes" : "No"}`);
  info.push(`Touch Support: ${"ontouchstart" in window ? "Yes" : "No"}`);
  info.push(`Max Touch Points: ${navigator.maxTouchPoints}`);

  // WebGPU情報
  info.push(`navigator.gpu: ${navigator.gpu ? "存在" : "不存在"}`);

  if (navigator.gpu) {
    try {
      const format = navigator.gpu.getPreferredCanvasFormat();
      info.push(`getPreferredCanvasFormat: ${format}`);
    } catch (e) {
      info.push(`getPreferredCanvasFormat error: ${e}`);
    }
  }

  // エラー情報
  if (error) {
    info.push("");
    info.push("=== エラー情報 ===");
    if (error instanceof Error) {
      info.push(`Error Message: ${error.message}`);
      info.push(`Error Name: ${error.name}`);
      if (error.stack) {
        info.push(`Stack: ${error.stack.split("\n").slice(0, 5).join("\n")}`);
      }
    } else {
      info.push(`Error: ${String(error)}`);
    }
  }

  return info.join("\n");
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
    const debugInfo = collectDebugInfo(
      new Error("navigator.gpu is not available")
    );
    console.error("WebGPU is not supported: navigator.gpu is not available");
    showWebGPUError(debugInfo);
    return;
  }

  // モバイルデバイスでは、より厳密にWebGPUの動作確認
  if (mobile) {
    try {
      const testAdapter = await navigator.gpu.requestAdapter();
      if (!testAdapter) {
        const debugInfo = collectDebugInfo(
          new Error("requestAdapter returned null")
        );
        console.error(
          "WebGPU adapter not available on mobile: requestAdapter returned null"
        );
        showWebGPUError(debugInfo);
        return;
      }

      // さらに、実際にデバイスを取得できるかテスト
      try {
        const testDevice = await testAdapter.requestDevice();
        testDevice.destroy(); // テスト用デバイスは破棄
      } catch (error) {
        const debugInfo = collectDebugInfo(error);
        console.error("WebGPU device request failed on mobile:", error);
        showWebGPUError(debugInfo);
        return;
      }
    } catch (error) {
      const debugInfo = collectDebugInfo(error);
      console.error("WebGPU adapter request failed on mobile:", error);
      showWebGPUError(debugInfo);
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
    const debugInfo = collectDebugInfo(error);
    showWebGPUError(debugInfo);
  }
}
