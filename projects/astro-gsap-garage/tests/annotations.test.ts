import { describe, it, expect } from "vitest";
import { f1Annotations } from "../src/lib/annotations/f1";
import { ironManAnnotations } from "../src/lib/annotations/iron-man";
import { lookAttr, hotspotAttr, explodeAttr, noteAttr } from "../src/lib/annotations/helpers";

describe("Annotations Data Validation", () => {
  it("should have correct counts (10 beats each) for both F1 and Iron Man", () => {
    expect(f1Annotations).toHaveLength(10);
    expect(ironManAnnotations).toHaveLength(10);
  });

  it("should have the first beat as hero and last beat as outro", () => {
    expect(f1Annotations[0].id).toBe("hero");
    expect(f1Annotations[f1Annotations.length - 1].id).toBe("outro");

    expect(ironManAnnotations[0].id).toBe("hero");
    expect(ironManAnnotations[ironManAnnotations.length - 1].id).toBe("outro");
  });

  it("should have valid look arrays with 7 elements for each beat", () => {
    for (const ann of [...f1Annotations, ...ironManAnnotations]) {
      expect(ann.look).toHaveLength(7);
      for (const num of ann.look) {
        expect(typeof num).toBe("number");
        expect(Number.isFinite(num)).toBe(true);
      }
    }
  });
});

describe("Annotation Helpers", () => {
  it("should format look arrays to comma-separated strings", () => {
    expect(lookAttr([1, 2, 3, 4, 5, 6, 7])).toBe("1,2,3,4,5,6,7");
  });

  it("should generate hotspot attribute values correctly", () => {
    expect(hotspotAttr({ id: 1, label: "Wing" })).toBe("1|Wing");
    expect(hotspotAttr({ id: 2 })).toBe("2|Part 2");
    expect(hotspotAttr({ id: "invalid" as any })).toBeNull();
  });

  it("should generate explode values as strings or null", () => {
    expect(explodeAttr({ explode: 0.15 })).toBe("0.15");
    expect(explodeAttr({})).toBeNull();
  });

  it("should generate note values as pipe-separated strings or null", () => {
    expect(noteAttr({ title: "My Title", body: "My Body" })).toBe("My Title|My Body");
    expect(noteAttr({ title: "Only Title" })).toBe("Only Title|");
    expect(noteAttr({})).toBeNull();
  });
});
