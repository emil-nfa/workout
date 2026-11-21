// Style 2: shaded 3D mannequin (three.js, WebGL). Built from the same rig and motion specs as the flat SVG.
// Used offline by scripts/render3d.mjs to pre-render short looping videos (nothing heavy runs on the phone).
import * as THREE from "three";
import { solve, TORSO, WIDTH, type Solved } from "./rig";
import type { Item, Motion } from "./motion";
import { bandEnds, boxQuat, dbEnds, jointPos, placed, vec } from "./geom";
import { camera } from "./svg";
import type { Muscle } from "../data/types";

const COLORS = { bg: 0x1f1f1f, floor: 0x2c2c2c, body: 0xe6e0d4, accent: 0x6e8bff, metal: 0x8c8c93, pad: 0x9c8f82, cable: 0xd8d4cc };

const LIMB_MUSCLE: Partial<Record<Muscle, string[]>> = {
  quads: ["thigh"], hamstrings: ["thigh"], adductors: ["thigh"], hipFlexors: ["thigh"], calves: ["shin"],
  biceps: ["upperArm"], triceps: ["upperArm"], forearms: ["forearm"],
};

export class Mannequin3D {
  renderer: THREE.WebGLRenderer;
  scene = new THREE.Scene();
  cam: THREE.PerspectiveCamera;
  private body = new THREE.MeshStandardMaterial({ color: COLORS.body, roughness: 0.55, metalness: 0.0 });
  private accent = new THREE.MeshStandardMaterial({ color: COLORS.accent, roughness: 0.45, metalness: 0.0, emissive: 0x1a2350 });
  private metal = new THREE.MeshStandardMaterial({ color: COLORS.metal, roughness: 0.5, metalness: 0.1 });
  private pad = new THREE.MeshStandardMaterial({ color: COLORS.pad, roughness: 0.85, metalness: 0.0 });
  private cableMat = new THREE.MeshStandardMaterial({ color: COLORS.cable, roughness: 0.6 });
  private hair = new THREE.MeshStandardMaterial({ color: 0x3b3631, roughness: 0.9 });
  private dark = new THREE.MeshStandardMaterial({ color: 0x4a4a4f, roughness: 0.45, metalness: 0.1 });
  private bandMat = new THREE.MeshStandardMaterial({ color: 0xc9a227, roughness: 0.7 });
  private parts = new Map<string, THREE.Mesh>();
  private items = new Map<string, THREE.Object3D>();
  private hl: Set<Muscle>;

  constructor(canvas: HTMLCanvasElement, private m: Motion, size = 540) {
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true });
    this.renderer.setSize(size, size, false);
    this.renderer.setPixelRatio(1);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.scene.background = new THREE.Color(COLORS.bg);
    this.hl = new Set(m.highlight);

    this.scene.add(new THREE.HemisphereLight(0xffffff, 0x2a2a2a, 1.3));
    const key = new THREE.DirectionalLight(0xffffff, 2.4);
    key.position.set(1.5, 3.2, 1.2);
    key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024);
    Object.assign(key.shadow.camera, { left: -2, right: 2, top: 2, bottom: -2, near: 0.5, far: 8 });
    key.shadow.radius = 4;
    this.scene.add(key);
    const rim = new THREE.DirectionalLight(0x9fb0ff, 0.6);
    rim.position.set(-2, 1.5, -1.5);
    this.scene.add(rim);

    const floor = new THREE.Mesh(new THREE.PlaneGeometry(12, 12), new THREE.MeshStandardMaterial({ color: COLORS.floor, roughness: 1 }));
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    this.scene.add(floor);

    // Camera framing: fit everything that moves over the whole rep.
    const v = m.view3d;
    const c = camera(v);
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i < 16; i++) {
      const s = solve(m.pose((i / 16) * m.period));
      pts.push(...Object.values(s.p));
      for (const it of m.items) {
        if (it.frame === false || it.kind !== "box" || it.look === "floor") continue;
        pts.push(vec((placed(it, s) as Extract<Item, { kind: "box" }>).center));
      }
    }
    const box = new THREE.Box3().setFromPoints(pts);
    const center = box.getCenter(new THREE.Vector3());
    const radius = box.getSize(new THREE.Vector3()).length() / 2;
    this.cam = new THREE.PerspectiveCamera(28, 1, 0.1, 30);
    const dist = (radius / Math.sin((28 * Math.PI) / 360)) * 1.0;
    this.cam.position.copy(center.clone().add(c.back.clone().multiplyScalar(dist)));
    this.cam.lookAt(center);
  }

  private mesh(key: string, geo: () => THREE.BufferGeometry, mat: THREE.Material): THREE.Mesh {
    let m = this.parts.get(key);
    if (!m) {
      m = new THREE.Mesh(geo(), mat);
      m.castShadow = true;
      m.receiveShadow = true;
      this.scene.add(m);
      this.parts.set(key, m);
    }
    return m;
  }

  /** Cylinder from a to b (unit cylinder scaled along its length). */
  private rod(key: string, a: THREE.Vector3, b: THREE.Vector3, r: number, mat: THREE.Material) {
    const m = this.mesh(key, () => new THREE.CylinderGeometry(1, 1, 1, 20, 1), mat);
    const d = b.clone().sub(a);
    m.position.copy(a.clone().add(b).multiplyScalar(0.5));
    m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.clone().normalize());
    m.scale.set(r, d.length(), r);
  }
  private ball(key: string, p: THREE.Vector3, r: number | [number, number, number], mat: THREE.Material, q?: THREE.Quaternion) {
    const m = this.mesh(key, () => new THREE.SphereGeometry(1, 24, 16), mat);
    m.position.copy(p);
    if (q) m.quaternion.copy(q);
    if (Array.isArray(r)) m.scale.set(r[0], r[1], r[2]); else m.scale.setScalar(r);
  }

  private buildItems(s: Solved) {
    for (const it0 of this.m.items) {
      if (it0.kind === "db") {
        const [a, b] = dbEnds(it0, s);
        this.rod(`item-${it0.id}-bar`, a, b, 0.016, this.metal);
        const dir = b.clone().sub(a).normalize();
        const r = it0.heads ?? 0.055;
        this.rod(`item-${it0.id}-h1`, a.clone().sub(dir.clone().multiplyScalar(0.0)), a.clone().add(dir.clone().multiplyScalar(0.07)), r, this.dark);
        this.rod(`item-${it0.id}-h2`, b.clone().sub(dir.clone().multiplyScalar(0.07)), b.clone(), r, this.dark);
        continue;
      }
      if (it0.kind === "band") {
        const [a, b] = bandEnds(it0, s);
        this.rod(`item-${it0.id}`, a, b, it0.look === "strap" ? 0.014 : 0.01, it0.look === "strap" ? this.dark : this.bandMat);
        continue;
      }
      const it = placed(it0, s);
      if (it.kind === "box") {
        if (it.look === "floor") continue;
        let o = this.items.get(it.id) as THREE.Mesh | undefined;
        if (!o) {
          o = new THREE.Mesh(new THREE.BoxGeometry(...it.size), it.look === "pad" ? this.pad : this.metal);
          o.castShadow = o.receiveShadow = true;
          this.scene.add(o);
          this.items.set(it.id, o);
        }
        o.position.copy(vec(it.center));
        o.quaternion.copy(boxQuat(it.rot));
      } else if (it.kind === "cyl") {
        this.rod(`item-${it.id}`, vec(it.a), vec(it.b), it.r, it.look === "pad" ? this.pad : this.metal);
      } else {
        if (it.kind === "cable") this.rod(`item-${it.id}`, vec(it.from), jointPos(s, it.to), 0.009, this.cableMat);
      }
    }
  }

  frame(t: number) {
    const s = solve(this.m.pose(t));
    const p = s.p;
    const limbHl = new Set<string>();
    for (const mu of this.hl) for (const seg of LIMB_MUSCLE[mu] ?? []) limbHl.add(seg);
    const mat = (seg: string) => (limbHl.has(seg) ? this.accent : this.body);

    for (const k of ["L", "R"] as const) {
      this.rod(`thigh${k}`, p[`hip${k}`], p[`knee${k}`], WIDTH.thigh / 2, mat("thigh"));
      this.rod(`shin${k}`, p[`knee${k}`], p[`ankle${k}`], WIDTH.shin / 2, mat("shin"));
      this.rod(`foot${k}`, p[`heel${k}`], p[`toe${k}`], WIDTH.foot / 2, this.body);
      this.rod(`upperArm${k}`, p[`shoulder${k}`], p[`elbow${k}`], WIDTH.upperArm / 2, mat("upperArm"));
      this.rod(`forearm${k}`, p[`elbow${k}`], p[`wrist${k}`], WIDTH.forearm / 2, mat("forearm"));
      this.ball(`hip${k}`, p[`hip${k}`], WIDTH.thigh / 2, this.body);
      this.ball(`knee${k}`, p[`knee${k}`], WIDTH.thigh / 2 * 0.82, this.body);
      this.ball(`ankle${k}`, p[`ankle${k}`], WIDTH.shin / 2 * 0.9, this.body);
      this.ball(`heel${k}`, p[`heel${k}`], WIDTH.foot / 2, this.body);
      this.ball(`toe${k}`, p[`toe${k}`], WIDTH.foot / 2, this.body);
      this.ball(`elbow${k}`, p[`elbow${k}`], WIDTH.upperArm / 2 * 0.9, this.body);
      this.ball(`wrist${k}`, p[`wrist${k}`], WIDTH.forearm / 2, this.body);
      this.ball(`hand${k}`, p[`hand${k}`], [0.045, 0.06, 0.035], this.body);
      // Shoulder cap, coloured if a deltoid is a target.
      const delt = this.hl.has("rearDelts") || this.hl.has("sideDelts") || this.hl.has("frontDelts");
      this.ball(`shoulder${k}`, p[`shoulder${k}`], WIDTH.upperArm / 2 * 1.25, delt ? this.accent : this.body);
    }

    const q = (m: THREE.Matrix4) => new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().extractRotation(m));
    const qP = q(s.frames.pelvis), qW = q(s.frames.waist), qC = q(s.frames.chest);
    const up = (qq: THREE.Quaternion) => new THREE.Vector3(0, 1, 0).applyQuaternion(qq);
    // Torso: pelvis, abdomen and chest ellipsoids (a = front-back, b = side-side).
    this.ball("pelvisE", p.pelvis.clone().add(up(qP).multiplyScalar(0.02)), [TORSO.pelvis.a, 0.12, TORSO.pelvis.b], this.body, qP);
    this.ball("waistE", p.pelvis.clone().lerp(p.waist, 0.75), [TORSO.waist.a, 0.14, TORSO.waist.b], this.body, qW);
    this.ball("chestE", p.chest.clone().sub(up(qC).multiplyScalar(0.13)), [TORSO.chest.a, 0.17, TORSO.chest.b], this.body, qC);
    this.rod("neck", p.chest, p.neckTop, WIDTH.neck / 2, this.body);
    const headQ = q(s.frames.head);
    this.ball("head", p.head, [0.1, 0.12, 0.09], this.body, headQ);
    this.ball("nose", p.head.clone().lerp(p.nose, 0.7), [0.03, 0.035, 0.03], this.body, headQ);
    // Hair cap on the back and top of the head: front vs back reads instantly.
    const hairAt = p.head.clone().add(new THREE.Vector3(-0.022, 0.022, 0).applyQuaternion(headQ));
    this.ball("hair", hairAt, [0.092, 0.105, 0.088], this.hair, headQ);

    // Torso muscle patches, slightly proud of the surface.
    const X = (qq: THREE.Quaternion) => new THREE.Vector3(1, 0, 0).applyQuaternion(qq);
    const Z = (qq: THREE.Quaternion) => new THREE.Vector3(0, 0, 1).applyQuaternion(qq);
    const patch = (key: string, at: THREE.Vector3, size: [number, number, number], qq: THREE.Quaternion) => this.ball(key, at, size, this.accent, qq);
    const chestC = p.chest.clone().sub(up(qC).multiplyScalar(0.1));
    for (const mu of this.hl) {
      if (mu === "upperBack") for (const sg of [1, -1]) patch(`upperBack${sg}`, chestC.clone().add(X(qC).multiplyScalar(-0.075)).add(Z(qC).multiplyScalar(sg * 0.06)), [0.05, 0.1, 0.05], qC);
      if (mu === "abs") patch("abs", p.waist.clone().add(X(qW).multiplyScalar(0.06)).sub(up(qW).multiplyScalar(0.05)), [0.05, 0.11, 0.08], qW);
      if (mu === "obliques") for (const sg of [1, -1]) patch(`obl${sg}`, p.waist.clone().add(Z(qW).multiplyScalar(sg * 0.11)).sub(up(qW).multiplyScalar(0.05)).add(X(qW).multiplyScalar(0.015)), [0.06, 0.1, 0.05], qW);
      if (mu === "glutes") for (const sg of [1, -1]) patch(`glute${sg}`, p.pelvis.clone().add(X(qP).multiplyScalar(-0.07)).add(Z(qP).multiplyScalar(sg * 0.075)).sub(up(qP).multiplyScalar(0.05)), [0.06, 0.08, 0.07], qP);
      if (mu === "chest") patch("chestM", chestC.clone().add(X(qC).multiplyScalar(0.07)), [0.06, 0.08, 0.16], qC);
      if (mu === "lats") patch("lats", p.waist.clone().add(X(qW).multiplyScalar(-0.05)).add(up(qW).multiplyScalar(0.08)), [0.06, 0.12, 0.17], qW);
      if (mu === "lowerBack") patch("lowerBack", p.waist.clone().add(X(qW).multiplyScalar(-0.06)).sub(up(qW).multiplyScalar(0.06)), [0.05, 0.08, 0.08], qW);
    }

    this.buildItems(s);
    this.renderer.render(this.scene, this.cam);
  }
}
