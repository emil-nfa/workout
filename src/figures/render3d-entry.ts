// Dev-only page driven by scripts/render3d.mjs: renders one motion frame by frame.
import { MOTIONS } from "./motions";
import { Mannequin3D } from "./three3d";

let r: Mannequin3D | null = null;
declare global { interface Window { r3d: { setup: (id: string) => { period: number; tB: number }; frame: (t: number) => void } } }
window.r3d = {
  setup(id) {
    r = new Mannequin3D(document.getElementById("c") as HTMLCanvasElement, MOTIONS[id]);
    return { period: MOTIONS[id].period, tB: MOTIONS[id].tB };
  },
  frame(t) { r!.frame(t); },
};
document.title = "ready";
