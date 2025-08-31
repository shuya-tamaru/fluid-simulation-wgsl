import GUI from "lil-gui";
import { FluidScene } from "../scenes/FluidScene";
import { SphParams } from "../compute/sph/SphParams";
import { SphSimulator } from "../compute/sph/SphSimulator";

export class FluidGui {
  private gui: GUI;
  private scene: FluidScene;
  private simulator: SphSimulator;
  private params: SphParams;

  constructor(scene: FluidScene, params: SphParams, simulator: SphSimulator) {
    this.gui = new GUI({ title: "Fluid Controls" });
    this.scene = scene;
    this.simulator = simulator;
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
        this.simulator.updateSphParams(v, this.params.boxDepth);

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
        this.simulator.updateSphParams(this.params.boxWidth, v);
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
        this.reCreateParams(v);
        this.resetSimulation();
        this.scene.resetSimulation();
      });
  }

  reCreateParams(v: number) {
    this.params.dispose();
    this.params.setParticleCount(v);
    this.params.init();
  }

  resetSimulation() {
    this.simulator.resetSimulation();
  }

  dispose() {
    this.gui.destroy();
  }
}
