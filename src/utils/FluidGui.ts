import GUI from "lil-gui";
import { FluidScene } from "../scenes/FluidScene";
import type { SphParams } from "../compute/sph/SphParams";

export class FluidGui {
  private gui: GUI;
  private scene: FluidScene;
  private params: SphParams;

  constructor(scene: FluidScene, params: SphParams) {
    this.gui = new GUI({ title: "Fluid Controls" });
    this.scene = scene;
    this.params = params;
    this.init();
  }

  init() {
    this.gui
      .add(this.params, "boxWidth", 16, 64, 1)
      .name("Box Width")
      .onChange((v: number) => {
        this.params.boxWidth = v;
        //bufferの更新

        // WireBoxのサイズも更新
        this.scene.updateBoxSize(
          v,
          this.params.boxHeight,
          this.params.boxDepth
        );
      });
    this.gui
      .add(this.params, "boxDepth", 16, 64, 1)
      .name("Box Depth")
      .onChange((v: number) => {
        this.params.boxDepth = v;
        this.scene.updateBoxSize(
          this.params.boxWidth,
          this.params.boxHeight,
          v
        );
      });
    this.gui
      .add(this.params, "particleCount", 5000, 30000, 5000)
      .name("Sphere Count")
      .onChange((v: number) => {
        this.params.particleCount = v;
        this.scene.resetSimulation();
      });
  }

  dispose() {
    this.gui.destroy();
  }
}
