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

function updateDebugInfoAlways(info: string) {
  const debugElement = document.getElementById("debug-info-always");
  if (debugElement) {
    debugElement.textContent = info;
    debugElement.style.display = "block";
  }
}

export async function bootstrap() {
  // 初期デバッグ情報を表示
  const initialDebugInfo = collectDebugInfo();
  updateDebugInfoAlways(initialDebugInfo);

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

  // デバッグ情報を更新
  let debugInfo = collectDebugInfo();
  debugInfo += `\n\n=== 初期化プロセス ===\n`;
  debugInfo += `Canvas found: Yes\n`;
  debugInfo += `Mobile detected: ${mobile ? "Yes" : "No"}\n`;
  updateDebugInfoAlways(debugInfo);

  // WebGPUの事前チェック
  if (!navigator.gpu) {
    debugInfo = collectDebugInfo(new Error("navigator.gpu is not available"));
    debugInfo += `\n\n=== チェック結果 ===\nnavigator.gpu: 不存在\n`;
    updateDebugInfoAlways(debugInfo);
    console.error("WebGPU is not supported: navigator.gpu is not available");
    showWebGPUError(debugInfo);
    return;
  }

  // navigator.gpuが存在する場合のデバッグ情報更新
  debugInfo = collectDebugInfo();
  debugInfo += `\n\n=== チェック結果 ===\nnavigator.gpu: 存在\n`;
  updateDebugInfoAlways(debugInfo);

  // モバイルデバイスでは、より厳密にWebGPUの動作確認
  if (mobile) {
    try {
      debugInfo += `requestAdapter() テスト中...\n`;
      updateDebugInfoAlways(debugInfo);

      const testAdapter = await navigator.gpu.requestAdapter();
      if (!testAdapter) {
        debugInfo = collectDebugInfo(new Error("requestAdapter returned null"));
        debugInfo += `\n\n=== チェック結果 ===\nrequestAdapter(): null\n`;
        updateDebugInfoAlways(debugInfo);
        console.error(
          "WebGPU adapter not available on mobile: requestAdapter returned null"
        );
        showWebGPUError(debugInfo);
        return;
      }

      debugInfo += `requestAdapter(): 成功\n`;
      updateDebugInfoAlways(debugInfo);

      // さらに、実際にデバイスを取得できるかテスト
      try {
        debugInfo += `requestDevice() テスト中...\n`;
        updateDebugInfoAlways(debugInfo);

        const testDevice = await testAdapter.requestDevice();
        testDevice.destroy(); // テスト用デバイスは破棄

        debugInfo += `requestDevice(): 成功\n`;
        updateDebugInfoAlways(debugInfo);
      } catch (error) {
        debugInfo = collectDebugInfo(error);
        debugInfo += `\n\n=== チェック結果 ===\nrequestDevice(): 失敗\n`;
        updateDebugInfoAlways(debugInfo);
        console.error("WebGPU device request failed on mobile:", error);
        showWebGPUError(debugInfo);
        return;
      }
    } catch (error) {
      debugInfo = collectDebugInfo(error);
      debugInfo += `\n\n=== チェック結果 ===\nrequestAdapter(): 例外発生\n`;
      updateDebugInfoAlways(debugInfo);
      console.error("WebGPU adapter request failed on mobile:", error);
      showWebGPUError(debugInfo);
      return;
    }
  }

  try {
    debugInfo += `\n\n=== Device.init() 開始 ===\n`;
    updateDebugInfoAlways(debugInfo);

    //initialize device
    const { device, context, format } = await Device.init(canvas);

    debugInfo += `Device.init(): 成功\n`;
    debugInfo += `Format: ${format}\n`;
    updateDebugInfoAlways(debugInfo);

    debugInfo += `\nTransformSystem作成中...\n`;
    updateDebugInfoAlways(debugInfo);
    //params
    const trans = new TransformSystem(device);

    debugInfo += `SphParams作成中...\n`;
    updateDebugInfoAlways(debugInfo);
    const params = new SphParams(device, 32, 16, 16, 10000);

    debugInfo += `createAssets() 実行中...\n`;
    updateDebugInfoAlways(debugInfo);
    //assets
    const { wireBox, particles, timeStep } = createAssets(
      device,
      format,
      trans,
      params
    );
    debugInfo += `createAssets(): 成功\n`;
    updateDebugInfoAlways(debugInfo);

    debugInfo += `SphSimulator作成中...\n`;
    updateDebugInfoAlways(debugInfo);
    //compute
    const simulator = new SphSimulator(device, params, particles, timeStep);
    debugInfo += `SphSimulator: 成功\n`;
    updateDebugInfoAlways(debugInfo);

    debugInfo += `FluidScene作成中...\n`;
    updateDebugInfoAlways(debugInfo);
    //scene
    const scene = new FluidScene(wireBox, particles);
    debugInfo += `FluidScene: 成功\n`;
    updateDebugInfoAlways(debugInfo);

    debugInfo += `FluidGui作成中...\n`;
    updateDebugInfoAlways(debugInfo);
    //gui
    new FluidGui(scene, params, simulator);
    debugInfo += `FluidGui: 成功\n`;
    updateDebugInfoAlways(debugInfo);

    debugInfo += `Renderer作成中...\n`;
    updateDebugInfoAlways(debugInfo);
    //renderer
    const renderer = new Renderer(
      device,
      context,
      canvas,
      scene,
      simulator,
      trans
    );
    debugInfo += `Renderer: 成功\n`;
    updateDebugInfoAlways(debugInfo);

    debugInfo += `renderer.init() 実行中...\n`;
    updateDebugInfoAlways(debugInfo);
    await renderer.init();
    debugInfo += `renderer.init(): 成功\n`;
    updateDebugInfoAlways(debugInfo);

    debugInfo += `resizeハンドラ設定中...\n`;
    updateDebugInfoAlways(debugInfo);
    //resize
    attachResize(canvas, (w, h) => {
      renderer.onResize(w, h);
    });
    debugInfo += `resizeハンドラ: 設定完了\n`;
    updateDebugInfoAlways(debugInfo);

    debugInfo += `Stats作成中...\n`;
    updateDebugInfoAlways(debugInfo);
    // stats
    const stats = new Stats();
    stats.showPanel(0);
    document.body.appendChild(stats.dom);
    debugInfo += `Stats: 追加完了\n`;
    updateDebugInfoAlways(debugInfo);

    debugInfo += `レンダリングループ開始...\n`;
    updateDebugInfoAlways(debugInfo);
    //requestAnimationFrame
    let frameCount = 0;
    const loop = () => {
      try {
        stats?.begin();

        const dt = 1 / 60;
        timeStep.set(dt);
        renderer.update();
        renderer.render();

        stats?.end();
        frameCount++;
        if (frameCount === 1) {
          debugInfo += `レンダリングループ: 1フレーム目完了\n`;
          updateDebugInfoAlways(debugInfo);
        } else if (frameCount === 60) {
          debugInfo += `レンダリングループ: 60フレーム目完了（正常動作中）\n`;
          updateDebugInfoAlways(debugInfo);
        }
        requestAnimationFrame(loop);
      } catch (error) {
        debugInfo += `\nレンダリングループでエラー: ${
          error instanceof Error ? error.message : String(error)
        }\n`;
        updateDebugInfoAlways(debugInfo);
        throw error;
      }
    };
    requestAnimationFrame(loop);

    debugInfo += `\n=== 初期化完了！レンダリングループ開始 ===\n`;
    updateDebugInfoAlways(debugInfo);
  } catch (error) {
    console.error("WebGPU initialization failed:", error);
    // エラーの詳細をログに出力
    if (error instanceof Error) {
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    }
    debugInfo = collectDebugInfo(error);
    debugInfo += `\n\n=== エラー発生 ===\n初期化に失敗しました\n`;
    updateDebugInfoAlways(debugInfo);
    showWebGPUError(debugInfo);
  }
}
