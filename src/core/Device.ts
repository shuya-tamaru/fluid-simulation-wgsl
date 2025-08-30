export class Device {
  static async init(canvas: HTMLCanvasElement) {
    if (!navigator.gpu) {
      throw new Error("GPU is not supported");
    }

    const adapter = await navigator.gpu.requestAdapter({
      powerPreference: "high-performance",
    });
    if (!adapter) {
      throw new Error("GPU adapter not found");
    }

    const device = await adapter.requestDevice();

    const context = canvas.getContext("webgpu");
    if (!context) {
      throw new Error("WebGPU context not found");
    }
    const format = navigator.gpu.getPreferredCanvasFormat();

    context.configure({
      device,
      format,
      alphaMode: "opaque",
    });

    return { device, context, format };
  }
}
