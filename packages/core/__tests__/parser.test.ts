import { describe, it, expect } from "vitest";
import { F2CParser } from "../src/parser.js";

const sampleFigmaNode = {
  id: "1:100",
  name: "PrimaryButton",
  type: "COMPONENT",
  layoutMode: "HORIZONTAL",
  primaryAxisAlignItems: "CENTER",
  counterAxisAlignItems: "CENTER",
  layoutSizingHorizontal: "HUG",
  layoutSizingVertical: "FIXED",
  absoluteBoundingBox: { x: 0, y: 0, width: 120, height: 40 },
  paddingTop: 8,
  paddingRight: 16,
  paddingBottom: 8,
  paddingLeft: 16,
  itemSpacing: 8,
  fills: [
    {
      type: "SOLID",
      color: { r: 0.231, g: 0.51, b: 0.965, a: 1 },
    },
  ],
  cornerRadius: 8,
  strokes: [
    {
      type: "SOLID",
      color: { r: 0.114, g: 0.306, b: 0.847, a: 1 },
    },
  ],
  strokeWeight: 1,
  effects: [
    {
      type: "DROP_SHADOW",
      visible: true,
      offset: { x: 0, y: 4 },
      radius: 10,
      color: { r: 0, g: 0, b: 0, a: 0.1 },
    },
  ],
  opacity: 1.0,
  visible: true,
  children: [
    {
      id: "1:101",
      name: "Label",
      type: "TEXT",
      characters: "Submit",
      style: {
        fontFamily: "Pretendard",
        fontSize: 14,
        fontWeight: 600,
        lineHeightPercentFontSize: 120,
        letterSpacing: 0,
      },
      absoluteBoundingBox: { x: 16, y: 8, width: 50, height: 20 },
      fills: [{ type: "SOLID", color: { r: 1, g: 1, b: 1, a: 1 } }],
      visible: true,
      children: [],
    },
  ],
};

describe("F2CParser", () => {
  it("should use default scaleFactor of 4.0", () => {
    const parser = new F2CParser();
    const ir = parser.parse(sampleFigmaNode);
    expect(ir.metadata.scaleFactor).toBe(4.0);
    expect(ir.metadata.version).toBe("1.0");
    expect(ir.metadata.unit).toBe("px");
  });

  it("should accept custom scaleFactor", () => {
    const parser = new F2CParser({ scaleFactor: 2.0 });
    const ir = parser.parse(sampleFigmaNode);
    expect(ir.metadata.scaleFactor).toBe(2.0);
  });

  it("should parse identity correctly", () => {
    const parser = new F2CParser();
    const ir = parser.parse(sampleFigmaNode);
    const node = ir.nodes[0];

    expect(node.identity.id).toBe("1:100");
    expect(node.identity.name).toBe("PrimaryButton");
    expect(node.identity.type).toBe("COMPONENT");
  });

  it("should compute layout values with scaleFactor", () => {
    const parser = new F2CParser({ scaleFactor: 4.0 });
    const ir = parser.parse(sampleFigmaNode);
    const layout = ir.nodes[0].layout;

    expect(layout.direction).toBe("horizontal");
    expect(layout.align).toBe("center");
    expect(layout.justify).toBe("center");
    expect(layout.widthMode).toBe("hug");
    expect(layout.heightMode).toBe("fixed");

    // Original values
    expect(layout.width).toBe(120);
    expect(layout.height).toBe(40);

    // Computed = original * 4
    expect(layout.computedWidth).toBe(480);
    expect(layout.computedHeight).toBe(160);

    // Padding
    expect(layout.padding).toEqual({ top: 8, right: 16, bottom: 8, left: 16 });
    expect(layout.computedPadding).toEqual({
      top: 32,
      right: 64,
      bottom: 32,
      left: 64,
    });

    // Gap
    expect(layout.gap).toBe(8);
    expect(layout.computedGap).toBe(32);
  });

  it("should parse style with backgroundColor in hex", () => {
    const parser = new F2CParser();
    const ir = parser.parse(sampleFigmaNode);
    const style = ir.nodes[0].style;

    // RGBA(0.231, 0.51, 0.965) → hex
    expect(style.backgroundColor).toMatch(/^#[0-9A-F]{6}$/);
    expect(style.opacity).toBe(1.0);
    expect(style.visibility).toBe("visible");
  });

  it("should compute borderRadius with scaleFactor", () => {
    const parser = new F2CParser({ scaleFactor: 4.0 });
    const ir = parser.parse(sampleFigmaNode);
    const style = ir.nodes[0].style;

    expect(style.borderRadius).toEqual([8, 8, 8, 8]);
    expect(style.computedBorderRadius).toEqual([32, 32, 32, 32]);
  });

  it("should extract border from strokes", () => {
    const parser = new F2CParser({ scaleFactor: 4.0 });
    const ir = parser.parse(sampleFigmaNode);
    const border = ir.nodes[0].style.border;

    expect(border).not.toBeNull();
    expect(border!.width).toBe(1);
    expect(border!.computedWidth).toBe(4);
    expect(border!.style).toBe("solid");
  });

  it("should extract shadows with computed values", () => {
    const parser = new F2CParser({ scaleFactor: 4.0 });
    const ir = parser.parse(sampleFigmaNode);
    const shadows = ir.nodes[0].style.shadows;

    expect(shadows).toHaveLength(1);
    expect(shadows[0].x).toBe(0);
    expect(shadows[0].y).toBe(4);
    expect(shadows[0].blur).toBe(10);
    expect(shadows[0].computedY).toBe(16);
    expect(shadows[0].computedBlur).toBe(40);
  });

  it("should parse TEXT node content with typography", () => {
    const parser = new F2CParser({ scaleFactor: 4.0 });
    const ir = parser.parse(sampleFigmaNode);
    const textNode = ir.nodes[0].children[0];

    expect(textNode.content.text).toBe("Submit");
    expect(textNode.content.typography).toBeDefined();
    expect(textNode.content.typography!.fontFamily).toBe("Pretendard");
    expect(textNode.content.typography!.fontSize).toBe(14);
    expect(textNode.content.typography!.computedFontSize).toBe(56);
    expect(textNode.content.typography!.fontWeight).toBe(600);
    expect(textNode.content.typography!.lineHeight).toBe(1.2);
  });

  it("should recursively parse children", () => {
    const parser = new F2CParser();
    const ir = parser.parse(sampleFigmaNode);

    expect(ir.nodes[0].children).toHaveLength(1);
    expect(ir.nodes[0].children[0].identity.name).toBe("Label");
    expect(ir.nodes[0].children[0].identity.type).toBe("TEXT");
  });

  it("should handle node with no fills gracefully", () => {
    const parser = new F2CParser();
    const ir = parser.parse({
      id: "empty",
      name: "Empty",
      type: "FRAME",
      children: [],
    });
    const style = ir.nodes[0].style;

    expect(style.backgroundColor).toBe("transparent");
    expect(style.border).toBeNull();
    expect(style.shadows).toEqual([]);
  });

  it("should handle rectangleCornerRadii for individual corners", () => {
    const parser = new F2CParser({ scaleFactor: 2.0 });
    const ir = parser.parse({
      id: "rounded",
      name: "Rounded",
      type: "RECTANGLE",
      rectangleCornerRadii: [4, 8, 12, 16],
      children: [],
    });
    const style = ir.nodes[0].style;

    expect(style.borderRadius).toEqual([4, 8, 12, 16]);
    expect(style.computedBorderRadius).toEqual([8, 16, 24, 32]);
  });

  it("should handle hidden node", () => {
    const parser = new F2CParser();
    const ir = parser.parse({
      id: "hidden",
      name: "Hidden",
      type: "FRAME",
      visible: false,
      children: [],
    });
    expect(ir.nodes[0].style.visibility).toBe("hidden");
  });

  it("should handle rgba colors with opacity", () => {
    const parser = new F2CParser();
    const ir = parser.parse({
      id: "semi",
      name: "SemiTransparent",
      type: "RECTANGLE",
      fills: [
        {
          type: "SOLID",
          color: { r: 1, g: 0, b: 0, a: 1 },
          opacity: 0.5,
        },
      ],
      children: [],
    });
    expect(ir.nodes[0].style.backgroundColor).toBe("rgba(255,0,0,0.5)");
  });
});
