import type {
  StandardIR,
  IRNode,
  IRLayout,
  IRStyle,
  IRContent,
  IRBorder,
  IRShadow,
  IRTypography,
  IRPadding,
} from "@f2c/common";

/**
 * Serialized IR types — computed-only values with clean property names.
 * These are what the LLM sees.
 */

export interface SerializedPadding {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export interface SerializedBorder {
  width: number;
  color: string;
  style: "solid" | "dashed" | "none";
}

export interface SerializedShadow {
  x: number;
  y: number;
  blur: number;
  color: string;
}

export interface SerializedTypography {
  fontFamily: string;
  fontSize: number;
  fontWeight: number;
  lineHeight: number;
  letterSpacing: number;
}

export interface SerializedLayout {
  display: "flex" | "block" | "none";
  direction: "horizontal" | "vertical";
  align: string;
  justify: string;
  widthMode: "fixed" | "hug" | "fill";
  heightMode: "fixed" | "hug" | "fill";
  width: number;
  height: number;
  padding: SerializedPadding;
  gap: number;
}

export interface SerializedStyle {
  backgroundColor: string;
  borderRadius: [number, number, number, number];
  border: SerializedBorder | null;
  shadows: SerializedShadow[];
  opacity: number;
  visibility: "visible" | "hidden";
}

export interface SerializedNode {
  identity: { id: string; name: string; type: string };
  layout: SerializedLayout;
  style: SerializedStyle;
  content?: { text?: string; typography?: SerializedTypography; icon?: string };
  children: SerializedNode[];
}

export interface SerializedIR {
  metadata: { version: string; unit: "px" };
  nodes: SerializedNode[];
}

/**
 * Serialize StandardIR for LLM consumption.
 * - Replaces raw values with computed values
 * - Strips computed prefix from property names
 * - Omits empty content
 * - Reduces token count ~30-40%
 */
export function serializeIR(ir: StandardIR): SerializedIR {
  return {
    metadata: {
      version: ir.metadata.version,
      unit: ir.metadata.unit,
    },
    nodes: ir.nodes.map(serializeNode),
  };
}

function serializeNode(node: IRNode): SerializedNode {
  const result: SerializedNode = {
    identity: { ...node.identity },
    layout: serializeLayout(node.layout),
    style: serializeStyle(node.style),
    children: node.children.map(serializeNode),
  };

  const content = serializeContent(node.content);
  if (content) {
    result.content = content;
  }

  return result;
}

function serializeLayout(layout: IRLayout): SerializedLayout {
  return {
    display: layout.display,
    direction: layout.direction,
    align: layout.align,
    justify: layout.justify,
    widthMode: layout.widthMode,
    heightMode: layout.heightMode,
    width: layout.computedWidth,
    height: layout.computedHeight,
    padding: { ...layout.computedPadding },
    gap: layout.computedGap,
  };
}

function serializeStyle(style: IRStyle): SerializedStyle {
  return {
    backgroundColor: style.backgroundColor,
    borderRadius: [...style.computedBorderRadius],
    border: style.border
      ? {
          width: style.border.computedWidth,
          color: style.border.color,
          style: style.border.style,
        }
      : null,
    shadows: style.shadows.map(serializeShadow),
    opacity: style.opacity,
    visibility: style.visibility,
  };
}

function serializeShadow(shadow: IRShadow): SerializedShadow {
  return {
    x: shadow.computedX,
    y: shadow.computedY,
    blur: shadow.computedBlur,
    color: shadow.color,
  };
}

function serializeContent(
  content: IRContent
): SerializedNode["content"] | undefined {
  const hasText = content.text !== undefined && content.text !== "";
  const hasIcon = content.icon !== undefined;

  if (!hasText && !hasIcon) return undefined;

  const result: NonNullable<SerializedNode["content"]> = {};

  if (hasText) {
    result.text = content.text;
    if (content.typography) {
      result.typography = serializeTypography(content.typography);
    }
  }

  if (hasIcon) {
    result.icon = content.icon;
  }

  return result;
}

function serializeTypography(typo: IRTypography): SerializedTypography {
  return {
    fontFamily: typo.fontFamily,
    fontSize: typo.computedFontSize,
    fontWeight: typo.fontWeight,
    lineHeight: typo.lineHeight,
    letterSpacing: typo.computedLetterSpacing,
  };
}
