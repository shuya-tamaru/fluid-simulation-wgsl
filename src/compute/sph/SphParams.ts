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

  private physicsParamsBuffer!: GPUBuffer;
  private spatialParamsBuffer!: GPUBuffer;

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

    this.init();
  }

  init() {
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

  private getPhysicsParams() {
    const f = new Float32Array(16);
    let i = 0;
    f[i++] = this.h;
    f[i++] = this.h2;
    f[i++] = this.h3;
    f[i++] = this.h6;
    f[i++] = this.h9;

    f[i++] = this.poly6;
    f[i++] = this.spiky;
    f[i++] = this.viscosity;

    f[i++] = this.mass;
    f[i++] = this.restDensity;
    f[i++] = this.pressureStiffness;
    f[i++] = this.viscosityMu;
    f[i++] = this.restitution;

    f[i++] = 0; // padding
    f[i++] = 0; // padding
    f[i++] = 0; // padding
    return f;
  }

  private getSpatialConfig() {
    // floats
    const f = new Float32Array(8);
    let fi = 0;
    f[fi++] = this.cellSize;
    f[fi++] = this.xMin;
    f[fi++] = this.yMin;
    f[fi++] = this.zMin;
    f[fi++] = this.boxWidth;
    f[fi++] = this.boxHeight;
    f[fi++] = this.boxDepth;
    f[fi++] = 0; // padding

    // uints
    const u = new Uint32Array(8);
    let ui = 0;
    u[ui++] = this.particleCount;
    u[ui++] = this.cellCountX;
    u[ui++] = this.cellCountY;
    u[ui++] = this.cellCountZ;
    u[ui++] = this.totalCellCount;
    u[ui++] = 0; // padding
    u[ui++] = 0; // padding
    u[ui++] = 0; // padding

    return { floats: f, uints: u };
  }

  private createBuffer() {
    const f_phys = this.getPhysicsParams();
    const { floats: f_spatial, uints: uints_spatial } = this.getSpatialConfig();
    this.physicsParamsBuffer = this.device.createBuffer({
      size: f_phys.byteLength,
      usage:
        GPUBufferUsage.UNIFORM |
        GPUBufferUsage.COPY_DST |
        GPUBufferUsage.COPY_SRC,
    });

    this.spatialParamsBuffer = this.device.createBuffer({
      size: f_spatial.byteLength + uints_spatial.byteLength,
      usage:
        GPUBufferUsage.UNIFORM |
        GPUBufferUsage.COPY_DST |
        GPUBufferUsage.COPY_SRC,
    });

    this.device.queue.writeBuffer(this.physicsParamsBuffer, 0, f_phys);
    this.device.queue.writeBuffer(this.spatialParamsBuffer, 0, f_spatial);
    this.device.queue.writeBuffer(
      this.spatialParamsBuffer,
      f_spatial.byteLength,
      uints_spatial
    );
  }

  getBufferPhysics() {
    return this.physicsParamsBuffer;
  }
  getBufferSpatial() {
    return this.spatialParamsBuffer;
  }

  dispose() {
    this.physicsParamsBuffer.destroy();
    this.spatialParamsBuffer.destroy();
  }
}
