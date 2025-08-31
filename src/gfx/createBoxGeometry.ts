export function createGeometry({
  w,
  h,
  d,
}: {
  w: number;
  h: number;
  d: number;
}) {
  const hx = w * 0.5;
  const hy = h * 0.5;
  const hz = d * 0.5;

  // prettier-ignore
  const v = new Float32Array([
    -hx,-hy,-hz,0,   +hx,-hy,-hz,0,   +hx,+hy,-hz,0,   -hx,+hy,-hz,0, // 0..3 (near)
    -hx,-hy,+hz,0,   +hx,-hy,+hz,0,   +hx,+hy,+hz,0,   -hx,+hy,+hz,0, // 4..7 (far)
  ]);

  // prettier-ignore
  const idx = new Uint16Array([
    0,1, 1,2, 2,3, 3,0,  // near face
    4,5, 5,6, 6,7, 7,4,  // far face
    0,4, 1,5, 2,6, 3,7,  // vertical
  ]);

  return { vertices: v, indices: idx };
}
