import { describe, it, expect } from "vitest";
import { serializeIR } from "../src/prompts/ir_serializer.js";
import type { StandardIR, IRNode } from "@f2c/common";

function makeNode(overrides: Partial<IRNode> = {}): IRNode {
  return {
    identity: { id: "1:100", name: "Button", type: "COMPONENT" },
    layout: {
      display: "flex",
      direction: "horizontal",
      align: "center",
      justify: "center",
      widthMode: "hug",
      heightMode: "fixed",
      width: 120,
      height: 40,
      computedWidth: 480,
      computedHeight: 160,
      padding: { top: 8, right: 16, bottom: 8, left: 16 },
      computedPadding: { top: 32, right: 64, bottom: 32, left: 64 },
      gap: 8,
      computedGap: 32,
    },
    style: {
      backgroundColor: "#3B82F6",
      borderRadius: [8, 8, 8, 8],
      computedBorderRadius: [32, 32, 32, 32],
      border: {
        width: 1,
        computedWidth: 4,
        color: "#1D4ED8",
        style: "solid",
      },
      shadows: [
        {
          x: 0,
          y: 4,
          blur: 10,
          computedX: 0,
          computedY: 16,
          computedBlur: 40,
          color: "rgba(0,0,0,0.1)",
        },
      ],
      opacity: 1.0,
      visibility: "visible",
    },
    content: {},
    children: [],
    ...overrides,
  };
}

function makeIR(nodes: IRNode[]): StandardIR {
  return {
    metadata: { version: "1.0", scaleFactor: 4.0, unit: "px" },
    nodes,
  };
}

describe("serializeIR", () => {
  it("should replace layout values with computed values", () => {
    const ir = makeIR([makeNode()]);
    const serialized = serializeIR(ir);
    const layout = serialized.nodes[0].layout;

    // computed values become the main values
    expect(layout.width).toBe(480);
    expect(layout.height).toBe(160);
    expect(layout.padding).toEqual({ top: 32, right: 64, bottom: 32, left: 64 });
    expect(layout.gap).toBe(32);

    // no computed* keys remain
    expect("computedWidth" in layout).toBe(false);
    expect("computedHeight" in layout).toBe(false);
    expect("computedPadding" in layout).toBe(false);
    expect("computedGap" in layout).toBe(false);
  });

  it("should replace style values with computed values", () => {
    const ir = makeIR([makeNode()]);
    const serialized = serializeIR(ir);
    const style = serialized.nodes[0].style;

    expect(style.borderRadius).toEqual([32, 32, 32, 32]);
    expect("computedBorderRadius" in style).toBe(false);

    expect(style.border!.width).toBe(4);
    expect("computedWidth" in style.border!).toBe(false);
  });

  it("should replace shadow values with computed values", () => {
    const ir = makeIR([makeNode()]);
    const serialized = serializeIR(ir);
    const shadow = serialized.nodes[0].style.shadows[0];

    expect(shadow.x).toBe(0);
    expect(shadow.y).toBe(16);
    expect(shadow.blur).toBe(40);
    expect("computedX" in shadow).toBe(false);
    expect("computedY" in shadow).toBe(false);
    expect("computedBlur" in shadow).toBe(false);
  });

  it("should omit content when empty", () => {
    const ir = makeIR([makeNode({ content: {} })]);
    const serialized = serializeIR(ir);

    expect(serialized.nodes[0].content).toBeUndefined();
  });

  it("should include content with text and typography", () => {
    const ir = makeIR([
      makeNode({
        content: {
          text: "Submit",
          typography: {
            fontFamily: "Pretendard",
            fontSize: 14,
            computedFontSize: 56,
            fontWeight: 600,
            lineHeight: 1.2,
            letterSpacing: 0,
            computedLetterSpacing: 0,
          },
        },
      }),
    ]);
    const serialized = serializeIR(ir);
    const content = serialized.nodes[0].content!;

    expect(content.text).toBe("Submit");
    expect(content.typography!.fontSize).toBe(56);
    expect(content.typography!.letterSpacing).toBe(0);
    expect("computedFontSize" in content.typography!).toBe(false);
    expect("computedLetterSpacing" in content.typography!).toBe(false);
  });

  it("should strip metadata scaleFactor", () => {
    const ir = makeIR([makeNode()]);
    const serialized = serializeIR(ir);

    expect(serialized.metadata.version).toBe("1.0");
    expect(serialized.metadata.unit).toBe("px");
    expect("scaleFactor" in serialized.metadata).toBe(false);
  });

  it("should recursively serialize children", () => {
    const child = makeNode({
      identity: { id: "1:101", name: "Label", type: "TEXT" },
      content: {
        text: "Click",
        typography: {
          fontFamily: "Inter",
          fontSize: 12,
          computedFontSize: 48,
          fontWeight: 400,
          lineHeight: 1.2,
          letterSpacing: 0.5,
          computedLetterSpacing: 2,
        },
      },
    });
    const parent = makeNode({ children: [child] });
    const ir = makeIR([parent]);
    const serialized = serializeIR(ir);

    expect(serialized.nodes[0].children).toHaveLength(1);
    const serializedChild = serialized.nodes[0].children[0];
    expect(serializedChild.identity.name).toBe("Label");
    expect(serializedChild.content!.typography!.fontSize).toBe(48);
  });

  it("should handle null border", () => {
    const node = makeNode();
    node.style.border = null;
    const ir = makeIR([node]);
    const serialized = serializeIR(ir);

    expect(serialized.nodes[0].style.border).toBeNull();
  });

  it("should produce valid JSON", () => {
    const ir = makeIR([makeNode()]);
    const serialized = serializeIR(ir);
    const json = JSON.stringify(serialized);

    expect(() => JSON.parse(json)).not.toThrow();
    expect(json).not.toContain("computed");
  });
});
