import { describe, expect, it } from "vitest";
import { LEN, solve, type Pose } from "../figures/rig";

const stand: Pose = { root: { pos: [0, 0.95, 0] } };
const dist = (a: { distanceTo: (b: never) => number }, b: unknown) => a.distanceTo(b as never);

describe("rig forward kinematics", () => {
  it("standing: feet below hips, hands at the sides, head on top", () => {
    const { p } = solve(stand);
    expect(p.ankleL.y).toBeCloseTo(0.95 - LEN.thigh - LEN.shin, 5);
    expect(p.ankleL.z).toBeCloseTo(LEN.hipHalf, 5);
    expect(p.handR.z).toBeLessThan(0);
    expect(p.head.y).toBeGreaterThan(p.chest.y);
  });
  it("hip flexion moves the thigh forward, knee flexion moves the shin back", () => {
    const { p } = solve({ ...stand, legL: { flex: 90, knee: 90 } });
    expect(p.kneeL.x).toBeCloseTo(LEN.thigh, 5);
    expect(p.ankleL.y).toBeCloseTo(0.95 - LEN.shin, 5);
  });
  it("spine flexion leans the chest forward", () => {
    expect(solve({ ...stand, spine: { flex: 40 } }).p.chest.x).toBeGreaterThan(0.2);
  });
});

describe("rig inverse kinematics", () => {
  it("puts the hand exactly on a reachable target, elbow toward the pole, bone lengths kept", () => {
    const target: [number, number, number] = [0.35, 1.3, 0.25];
    const s = solve({ ...stand, armL: { to: target, pole: [0, 1.2, 1] } });
    expect(s.errors).toEqual([]);
    expect(s.p.handL.distanceTo({ x: target[0], y: target[1], z: target[2] } as never)).toBeLessThan(1e-4);
    expect(dist(s.p.shoulderL, s.p.elbowL)).toBeCloseTo(LEN.upperArm, 5);
    expect(s.p.elbowL.z).toBeGreaterThan(s.p.shoulderL.z - 0.01);
  });
  it("puts the ankle on target with the knee bending forward and the sole along a direction", () => {
    const s = solve({ ...stand, root: { pos: [0, 0.6, 0] }, legR: { to: [0.3, 0.1, -0.09], pole: [1, 0.6, -0.09], sole: [1, 0, 0] } });
    expect(s.errors).toEqual([]);
    expect(s.p.ankleR.distanceTo({ x: 0.3, y: 0.1, z: -0.09 } as never)).toBeLessThan(1e-4);
    expect(s.p.kneeR.x).toBeGreaterThan(s.p.hipR.x);
    expect(Math.abs(s.p.toeR.y - s.p.heelR.y)).toBeLessThan(1e-3);
  });
  it("reports unreachable targets", () => {
    expect(solve({ ...stand, armR: { to: [2, 1.3, 0], pole: [0, 1, -1] } }).errors[0]).toMatch(/out of reach/);
  });
});
