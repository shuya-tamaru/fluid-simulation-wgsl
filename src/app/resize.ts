export function sizeCanvas(canvas: HTMLCanvasElement, maxDpr = 2) {
  const dpr = Math.min(window.devicePixelRatio || 1, maxDpr);
  const w = Math.floor(canvas.clientWidth * dpr);
  const h = Math.floor(canvas.clientHeight * dpr);
  const changed = canvas.width !== w || canvas.height !== h;
  canvas.width = w;
  canvas.height = h;
  return { w, h, dpr, changed };
}

export function attachResize(
  canvas: HTMLCanvasElement,
  onResize: (w: number, h: number) => void,
  maxDpr = 2
) {
  const apply = () => {
    const { w, h, changed } = sizeCanvas(canvas, maxDpr);
    if (changed) onResize(w, h);
  };
  apply();
  window.addEventListener("resize", apply);
  return () => window.removeEventListener("resize", apply);
}
