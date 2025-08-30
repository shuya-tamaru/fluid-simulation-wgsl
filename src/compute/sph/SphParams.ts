export class SphParams {
  private device: GPUDevice;
  //SPH parameters
  public h = 1.0;
  public cellSize = this.h;

  public h2 = this.h * this.h;
  public h3 = this.h * this.h2;
  public h6 = this.h3 * this.h3;
  public h9 = this.h3 * this.h3 * this.h3;
  public poly6 = 315 / (64 * Math.PI * this.h9);
  public spiky = -45 / (Math.PI * this.h6);
  public viscosity = 45 / (Math.PI * this.h6);

  public mass = 0.2;
  public restDensity = 0.8;
  public pressureStiffness = 100;
  public viscosityMu = 0.12;
  public tangentDamping = 0.1;
  public restitution = 0.1;

  //neighborhood search
  public boxWidth = 32;
  public boxHeight = 4;
  public boxDepth = 16;
  public particleCount = 10000;

  public cellCountX = 0;
  public cellCountY = 0;
  public cellCountZ = 0;
  public totalCellCount = 0;

  public xMin!: number;
  public yMin!: number;
  public zMin!: number;
  public xMax!: number;
  public yMax!: number;
  public zMax!: number;

  private sphParamsBuffer!: GPUBuffer;

  constructor(
    device: GPUDevice,
    boxWidth: number,
    boxHeight: number,
    boxDepth: number,
    particleCount: number
  ) {
    this.device = device;
    this.boxWidth = boxWidth;
    this.boxHeight = boxHeight;
    this.boxDepth = boxDepth;
    this.particleCount = particleCount;

    this.recalcBounds();
    this.recalcGrid();
    this.createBuffer();
  }

  setBox(w: number, h: number, d: number) {
    this.boxWidth = w;
    this.boxHeight = h;
    this.boxDepth = d;
    this.recalcBounds();
    this.recalcGrid(); // セル数/総セル数を更新（グリッド用バッファ再確保のトリガ）
  }

  setParticleCount(n: number) {
    this.particleCount = Math.max(0, n | 0);
  }

  private recalcBounds() {
    this.xMin = -this.boxWidth / 2;
    this.xMax = this.boxWidth / 2;
    this.yMin = -this.boxHeight / 2;
    this.yMax = this.boxHeight / 2;
    this.zMin = -this.boxDepth / 2;
    this.zMax = this.boxDepth / 2;
  }
  private recalcGrid() {
    const toCells = (len: number) =>
      Math.max(1, Math.ceil(len / this.cellSize));
    this.cellCountX = toCells(this.boxWidth);
    this.cellCountY = toCells(this.boxHeight);
    this.cellCountZ = toCells(this.boxDepth);
    this.totalCellCount = this.cellCountX * this.cellCountY * this.cellCountZ;
  }

  toUniformArray() {
    // floats
    const f = new Float32Array(6);
    let fo = 0;
    f[fo++] = this.h;
    f[fo++] = this.restDensity;
    f[fo++] = this.pressureStiffness;
    f[fo++] = this.viscosityMu;
    f[fo++] = this.mass;
    f[fo++] = this.cellSize;

    // integers（← u32 想定。Int32Array ではなく Uint32Array を使う）
    const u = new Uint32Array(4);
    let uo = 0;
    u[uo++] = this.particleCount >>> 0;
    u[uo++] = this.cellCountX >>> 0;
    u[uo++] = this.cellCountY >>> 0;
    u[uo++] = this.cellCountZ >>> 0;

    return { floats: f, uints: u };
  }

  private createBuffer() {
    const { floats, uints } = this.toUniformArray();

    this.sphParamsBuffer = this.device.createBuffer({
      size: floats.byteLength + uints.byteLength,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });
    this.device.queue.writeBuffer(this.sphParamsBuffer, 0, floats);
    this.device.queue.writeBuffer(
      this.sphParamsBuffer,
      floats.byteLength,
      uints
    );
  }

  getBuffer() {
    return this.sphParamsBuffer;
  }

  dispose() {
    this.sphParamsBuffer.destroy();
  }
}
