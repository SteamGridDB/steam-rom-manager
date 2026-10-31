import { describe, expect, it } from "vitest";
import {
  flagPresets,
  formatGradient,
  parseGradient,
} from "../../src/renderer/theme/gradient";

describe("gradient builder", () => {
  it("writes blended and striped gradients", () => {
    expect(formatGradient({ angle: 90, colors: ["#000", "#fff"], stripes: false })).toBe(
      "linear-gradient(90deg, #000 0%, #fff 100%)",
    );
    expect(formatGradient({ angle: 180, colors: ["red", "blue", "green"], stripes: true })).toBe(
      "linear-gradient(180deg, red 0% 33.33%, blue 33.33% 66.67%, green 66.67% 100%)",
    );
  });

  it("reads back what it writes, flags included", () => {
    for (const colors of Object.values(flagPresets)) {
      for (const stripes of [true, false]) {
        const g = { angle: 135, colors, stripes };
        expect(parseGradient(formatGradient(g))).toEqual(g);
      }
    }
  });

  it("reads colors with commas inside, and side keywords", () => {
    expect(
      parseGradient("linear-gradient(to right, rgba(255, 0, 0, 0.5) 0%, #00f 100%)"),
    ).toEqual({ angle: 90, colors: ["rgba(255, 0, 0, 0.5)", "#00f"], stripes: false });
    expect(parseGradient("linear-gradient(#123, #456)")).toEqual({
      angle: 180,
      colors: ["#123", "#456"],
      stripes: false,
    });
  });

  it("leaves what it can't edit to the text field", () => {
    expect(parseGradient("none")).toBeNull();
    expect(parseGradient("radial-gradient(circle, red, blue)")).toBeNull();
    expect(parseGradient("linear-gradient(to top right, red, blue)")).toBeNull();
    expect(
      parseGradient("linear-gradient(red, blue), linear-gradient(green, white)"),
    ).toBeNull();
  });
});
