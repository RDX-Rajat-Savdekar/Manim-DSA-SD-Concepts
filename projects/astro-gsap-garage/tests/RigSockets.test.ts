import { describe, it, expect } from "vitest";
import * as THREE from "three";
import { createRigSockets, fxIntensity } from "../src/lib/garageStage/RigSockets";

describe("fxIntensity", () => {
  it("coerces booleans and numbers", () => {
    expect(fxIntensity(true)).toBe(1);
    expect(fxIntensity(false)).toBe(0);
    expect(fxIntensity(0.7)).toBe(0.7);
    expect(fxIntensity(undefined)).toBe(0);
  });
});

describe("createRigSockets", () => {
  it("resolves head/hand/foot sockets from Mixamo-named bones", () => {
    const root = new THREE.Group();
    const hips = new THREE.Bone();
    hips.name = "mixamorigHips_01";
    const spine1 = new THREE.Bone();
    spine1.name = "mixamorigSpine1_03";
    const spine2 = new THREE.Bone();
    spine2.name = "mixamorigSpine2_04";
    const head = new THREE.Bone();
    head.name = "mixamorigHead_06";
    head.position.set(0, 1.6, 0);
    const leftHand = new THREE.Bone();
    leftHand.name = "mixamorigLeftHand_011";
    leftHand.position.set(-0.5, 1, 0.2);
    const rightFoot = new THREE.Bone();
    rightFoot.name = "mixamorigRightFoot_062";
    rightFoot.position.set(0.15, 0, 0);

    hips.add(spine1);
    spine1.add(spine2);
    spine2.add(head);
    hips.add(leftHand);
    hips.add(rightFoot);
    root.add(hips);
    root.updateMatrixWorld(true);

    const sockets = createRigSockets(root);
    sockets.update();
    expect(sockets.has("visor")).toBe(true);
    expect(sockets.has("unibeam")).toBe(true);
    expect(sockets.has("palmL")).toBe(true);
    expect(sockets.has("bootR")).toBe(true);

    const visor = sockets.getWorld("visor");
    expect(visor.y).toBeGreaterThan(1);
  });
});
