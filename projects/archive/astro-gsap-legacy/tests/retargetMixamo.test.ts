import { describe, it, expect } from "vitest";
import * as THREE from "three";
import { boneKey, aliasClipName, collectBoneMap, collectBindQuats } from "../src/lib/garageStage/retargetMixamo";

describe("retargetMixamo helpers", () => {
  describe("boneKey", () => {
    it("should normalize mixamorig and clean suffixes", () => {
      expect(boneKey("mixamorig:Hips")).toBe("hips");
      expect(boneKey("mixamorig_LeftArm_01")).toBe("leftarm");
      expect(boneKey("LeftForeArm")).toBe("leftforearm");
      expect(boneKey("")).toBe("");
    });
  });

  describe("aliasClipName", () => {
    it("should pass canonical name names", () => {
      expect(aliasClipName("idle")).toBe("idle");
      expect(aliasClipName("walk")).toBe("walk");
    });

    it("should resolve known Mixamo alias names to canonical names", () => {
      expect(aliasClipName("breathingidle")).toBe("idle");
      expect(aliasClipName("agree")).toBe("repulse");
      expect(aliasClipName("standingpointing")).toBe("repulse");
      expect(aliasClipName("flying")).toBe("thrust");
      expect(aliasClipName("lookingaround")).toBe("look");
    });
  });

  describe("collectBoneMap and collectBindQuats", () => {
    it("should traverse and build a clean bone map and bind pose", () => {
      const root = new THREE.Group();
      const hipBone = new THREE.Bone();
      hipBone.name = "mixamorigHips_01";
      hipBone.quaternion.set(0, 0, 0, 1);
      root.add(hipBone);

      const spineBone = new THREE.Bone();
      spineBone.name = "mixamorigSpine_02";
      spineBone.quaternion.set(0, 0, 0, 1);
      hipBone.add(spineBone);

      const boneMap = collectBoneMap(root);
      expect(boneMap.get("hips")).toBe("mixamorigHips_01");
      expect(boneMap.get("spine")).toBe("mixamorigSpine_02");

      const binds = collectBindQuats(root);
      expect(binds.get("hips")).toBeDefined();
      expect(binds.get("spine")).toBeDefined();
    });
  });
});
