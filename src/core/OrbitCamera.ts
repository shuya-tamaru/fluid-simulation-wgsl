import { mat4, vec3 } from "gl-matrix";

type Opts = {
  target?: [number, number, number];
  distance?: number;
  minDist?: number;
  maxDist?: number;
  theta?: number;
  phi?: number;
  rotSpeed?: number;
  zoomSpeed?: number;
  panSpeed?: number;
  panMouseButton?: "right" | "middle";
  fovY?: number;
};

export class OrbitCamera {
  private canvas: HTMLCanvasElement;

  private target = vec3.fromValues(0, 0, 0);
  private dist = 4;
  private minDist = 0.8;
  private maxDist = 20;
  private theta = Math.PI / 4;
  private phi = Math.PI / 3;
  private rotSpeed = 3.0;
  private zoomSpeed = 1.1;
  private panSpeed = 1.0;
  private panMouseButton: "right" | "middle" = "right";
  private fovY = Math.PI / 4;

  private dragging = false;
  private mode: "orbit" | "pan" | null = null;
  private lastX = 0;
  private lastY = 0;

  private view = mat4.create();

  constructor(canvas: HTMLCanvasElement, opts: Opts = {}) {
    this.canvas = canvas;
    if (opts.target) vec3.set(this.target, ...opts.target);
    if (opts.distance) this.dist = opts.distance;
    if (opts.minDist) this.minDist = opts.minDist;
    if (opts.maxDist) this.maxDist = opts.maxDist;
    if (opts.theta !== undefined) this.theta = opts.theta;
    if (opts.phi !== undefined) this.phi = opts.phi;
    if (opts.rotSpeed) this.rotSpeed = opts.rotSpeed;
    if (opts.zoomSpeed) this.zoomSpeed = opts.zoomSpeed;
    if (opts.panSpeed) this.panSpeed = opts.panSpeed;
    if (opts.panMouseButton) this.panMouseButton = opts.panMouseButton;
    if (opts.fovY) this.fovY = opts.fovY;

    this.attach();
    this.updateView();
  }

  private attach() {
    this.canvas.addEventListener("contextmenu", (e) => e.preventDefault());

    this.canvas.addEventListener("pointerdown", (e) => {
      this.dragging = true;
      this.lastX = e.clientX;
      this.lastY = e.clientY;

      const isPanBtn =
        (this.panMouseButton === "right" && e.button === 2) ||
        (this.panMouseButton === "middle" && e.button === 1);

      if (isPanBtn || (e.button === 0 && e.shiftKey)) {
        this.mode = "pan";
      } else {
        this.mode = "orbit";
      }
      (e.target as Element).setPointerCapture?.(e.pointerId);
    });

    this.canvas.addEventListener("pointermove", (e) => {
      if (!this.dragging) return;
      const dx = e.clientX - this.lastX;
      const dy = e.clientY - this.lastY;
      this.lastX = e.clientX;
      this.lastY = e.clientY;

      if (this.mode === "orbit") {
        this.handleOrbit(dx, dy);
      } else if (this.mode === "pan") {
        this.handlePan(dx, dy);
      }
    });

    this.canvas.addEventListener("pointerup", (e) => {
      this.dragging = false;
      this.mode = null;
      (e.target as Element).releasePointerCapture?.(e.pointerId);
    });

    this.canvas.addEventListener(
      "wheel",
      (e) => {
        e.preventDefault();
        const dir = e.deltaY > 0 ? 1 : -1;
        const factor = dir > 0 ? this.zoomSpeed : 1 / this.zoomSpeed;
        this.dist = Math.min(
          this.maxDist,
          Math.max(this.minDist, this.dist * factor)
        );
        this.updateView();
      },
      { passive: false }
    );
  }

  private handleOrbit(dx: number, dy: number) {
    const w = this.canvas.clientWidth || 1;
    const h = this.canvas.clientHeight || 1;
    const sx = (dx / w) * Math.PI * this.rotSpeed;
    const sy = (dy / h) * Math.PI * this.rotSpeed;

    this.theta += sx;
    this.phi -= sy;

    const eps = 0.001;
    this.phi = Math.min(Math.PI - eps, Math.max(eps, this.phi));
    this.updateView();
  }

  private handlePan(dx: number, dy: number) {
    const h = this.canvas.clientHeight || 1;
    const pixelsToWorld =
      ((2 * this.dist * Math.tan(this.fovY / 2)) / h) * this.panSpeed;

    const s = Math.sin(this.phi);
    const eye = vec3.fromValues(
      this.target[0] + this.dist * s * Math.cos(this.theta),
      this.target[1] + this.dist * Math.cos(this.phi),
      this.target[2] + this.dist * s * Math.sin(this.theta)
    );
    const f = vec3.normalize(
      vec3.create(),
      vec3.sub(vec3.create(), this.target, eye)
    );
    const worldUp = vec3.fromValues(0, 1, 0);
    const right = vec3.normalize(
      vec3.create(),
      vec3.cross(vec3.create(), f, worldUp)
    );
    const up = vec3.normalize(
      vec3.create(),
      vec3.cross(vec3.create(), right, f)
    );

    vec3.scaleAndAdd(this.target, this.target, right, -dx * pixelsToWorld);
    vec3.scaleAndAdd(this.target, this.target, up, dy * pixelsToWorld);

    this.updateView();
  }

  private updateView() {
    const s = Math.sin(this.phi);
    const ex = this.target[0] + this.dist * s * Math.cos(this.theta);
    const ey = this.target[1] + this.dist * Math.cos(this.phi);
    const ez = this.target[2] + this.dist * s * Math.sin(this.theta);
    mat4.lookAt(this.view, [ex, ey, ez], this.target, [0, 1, 0]);
  }

  getView() {
    return this.view;
  }
  setTarget(x: number, y: number, z: number) {
    vec3.set(this.target, x, y, z);
    this.updateView();
  }
  setDistance(d: number) {
    this.dist = Math.min(this.maxDist, Math.max(this.minDist, d));
    this.updateView();
  }
  setFovY(rad: number) {
    this.fovY = rad;
  }
}
