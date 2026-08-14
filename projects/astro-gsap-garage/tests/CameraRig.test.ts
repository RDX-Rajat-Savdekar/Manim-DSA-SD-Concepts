import { describe, it, expect } from "vitest";
import * as THREE from "three";
import { createCameraRig } from "../src/lib/garageStage/CameraRig";

describe("CameraRig Module", () => {
  it("should set target look correctly", () => {
    const camera = new THREE.PerspectiveCamera(28, 1, 0.1, 100);
    const canvas = {} as HTMLCanvasElement;
    const pivot = new THREE.Group();

    const rig = createCameraRig({
      camera,
      canvas,
      pivot,
      motionOff: false,
      mobileLite: false,
    });

    const targetLook = {
      azimuth: 45,
      elevation: 15,
      zoom: 1.2,
      tx: 0.1,
      ty: 0.2,
      tz: 0.3,
      fov: 32,
    };

    rig.setLook(targetLook);
    // Force snap to apply changes immediately
    const modelSize = new THREE.Vector3(1, 1, 1);
    rig.snap(modelSize, 3);

    // Verify camera fov
    expect(camera.fov).toBe(32);
    // Focus is (tx * modelSize.x, ty * modelSize.y, tz * modelSize.z) = (0.1, 0.2, 0.3)
    // Camera is positioned based on spherical orbit and looking at focus.
    // Let's verify that the camera coordinates are finite
    expect(Number.isFinite(camera.position.x)).toBe(true);
    expect(Number.isFinite(camera.position.y)).toBe(true);
    expect(Number.isFinite(camera.position.z)).toBe(true);
  });
});
