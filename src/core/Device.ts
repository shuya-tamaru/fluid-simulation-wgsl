export class Device {
  static async init(canvas: HTMLCanvasElement) {
    if (!navigator.gpu) {
      throw new Error("GPU is not supported: navigator.gpu is not available");
    }

    const adapter = await navigator.gpu.requestAdapter({
      powerPreference: "high-performance",
    });
    if (!adapter) {
      throw new Error("GPU adapter not found: requestAdapter returned null. This may happen on mobile devices even if navigator.gpu exists.");
    }

    let device: GPUDevice;
    try {
      device = await adapter.requestDevice();
    } catch (error) {
      throw new Error(`Failed to request device: ${error instanceof Error ? error.message : String(error)}`);
    }

    const context = canvas.getContext("webgpu");
    if (!context) {
      throw new Error("WebGPU context not found: getContext('webgpu') returned null");
    }
    
    const format = navigator.gpu.getPreferredCanvasFormat();

    try {
      context.configure({
        device,
        format,
        alphaMode: "opaque",
      });
    } catch (error) {
      throw new Error(`Failed to configure context: ${error instanceof Error ? error.message : String(error)}`);
    }

    return { device, context, format };
  }
}
