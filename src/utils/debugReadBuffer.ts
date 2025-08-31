export async function debugReadBuffer(
  device: GPUDevice,
  srcBuffer: GPUBuffer,
  size: number
) {
  // MAP_READ 用バッファを作成
  const readBuffer = device.createBuffer({
    size,
    usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ,
  });

  // コマンドで srcBuffer → readBuffer にコピー
  const encoder = device.createCommandEncoder();
  encoder.copyBufferToBuffer(srcBuffer, 0, readBuffer, 0, size);
  device.queue.submit([encoder.finish()]);

  // マップして内容を取得
  await readBuffer.mapAsync(GPUMapMode.READ);
  const copy = readBuffer.getMappedRange();
  const data = copy.slice(0); // ArrayBuffer コピー
  readBuffer.unmap();

  return data;
}
