export function createCubeGeometry(device: GPUDevice) {
  const p = [
    [-1, -1, -1],
    [1, -1, -1],
    [1, 1, -1],
    [-1, 1, -1], // 0..3 back (z-)
    [-1, -1, 1],
    [1, -1, 1],
    [1, 1, 1],
    [-1, 1, 1], // 4..7 front (z+)
  ] as const;

  const faces = [
    { idx: [1, 0, 3, 2], n: [0, 0, -1] }, // back  (z-)
    { idx: [4, 5, 6, 7], n: [0, 0, 1] }, // front (z+)
    { idx: [4, 0, 3, 7], n: [-1, 0, 0] }, // left  (x-)
    { idx: [1, 2, 6, 5], n: [1, 0, 0] }, // right (x+)
    { idx: [1, 0, 4, 5], n: [0, -1, 0] }, // bottom(y-)
    { idx: [3, 7, 6, 2], n: [0, 1, 0] }, // top   (y+)
  ];

  const verts: number[] = [];
  const inds: number[] = [];
  let base = 0;

  for (const f of faces) {
    const [a, b, c, d] = f.idx;
    const n = f.n;
    for (const vi of [a, b, c, d]) {
      verts.push(p[vi][0], p[vi][1], p[vi][2], n[0], n[1], n[2]);
    }
    inds.push(base + 0, base + 1, base + 2, base + 0, base + 2, base + 3);
    base += 4;
  }

  const vertices = new Float32Array(verts);
  const indices = new Uint16Array(inds);

  const vertexBuffer = device.createBuffer({
    size: vertices.byteLength,
    usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
    mappedAtCreation: true,
  });
  new Float32Array(vertexBuffer.getMappedRange()).set(vertices);
  vertexBuffer.unmap();

  const indexBuffer = device.createBuffer({
    size: indices.byteLength,
    usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST,
    mappedAtCreation: true,
  });
  new Uint16Array(indexBuffer.getMappedRange()).set(indices);
  indexBuffer.unmap();

  const layout: GPUVertexBufferLayout = {
    arrayStride: 24,
    attributes: [
      { shaderLocation: 0, offset: 0, format: "float32x3" },
      { shaderLocation: 1, offset: 12, format: "float32x3" },
    ],
  };

  return { vertexBuffer, indexBuffer, indexCount: indices.length, layout };
}
