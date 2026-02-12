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

export interface F2CParserOptions {
  scaleFactor?: number;
}

export class F2CParser {
  private scaleFactor: number;

  constructor(options?: F2CParserOptions) {
    this.scaleFactor = options?.scaleFactor ?? 4.0;
  }

  parse(figmaData: any): StandardIR {
    // Determine top-level nodes:
    // - If figmaData has an `id` and `type`, treat it as a single Figma node
    // - If figmaData has `nodes` array (our format), use those
    // - If figmaData has `document` (Figma API response), use document.children
    let rawNodes: any[];
    if (figmaData.document) {
      rawNodes = figmaData.document.children ?? [];
    } else if (figmaData.id && figmaData.type) {
      rawNodes = [figmaData];
    } else if (Array.isArray(figmaData.nodes)) {
      rawNodes = figmaData.nodes;
    } else {
      rawNodes = [figmaData];
    }

    const nodes = rawNodes.map((node: any) => this.parseNode(node));

    return {
      metadata: {
        version: "1.0",
        scaleFactor: this.scaleFactor,
        unit: "px",
      },
      nodes,
    };
  }

  private parseNode(figmaNode: any): IRNode {
    return {
      identity: {
        id: figmaNode.id ?? "",
        name: figmaNode.name ?? "",
        type: figmaNode.type ?? "FRAME",
      },
      layout: this.parseLayout(figmaNode),
      style: this.parseStyle(figmaNode),
      content: this.parseContent(figmaNode),
      children: (figmaNode.children ?? []).map((child: any) =>
        this.parseNode(child)
      ),
    };
  }

  private parseLayout(node: any): IRLayout {
    const direction = this.mapDirection(node.layoutMode);
    const width = node.absoluteBoundingBox?.width ?? node.size?.x ?? 0;
    const height = node.absoluteBoundingBox?.height ?? node.size?.y ?? 0;

    const padding: IRPadding = {
      top: node.paddingTop ?? 0,
      right: node.paddingRight ?? 0,
      bottom: node.paddingBottom ?? 0,
      left: node.paddingLeft ?? 0,
    };

    const computedPadding: IRPadding = {
      top: this.computeValue(padding.top),
      right: this.computeValue(padding.right),
      bottom: this.computeValue(padding.bottom),
      left: this.computeValue(padding.left),
    };

    const gap = node.itemSpacing ?? 0;

    return {
      display: node.layoutMode ? "flex" : "none",
      direction,
      align: this.mapAlign(node.counterAxisAlignItems),
      justify: this.mapJustify(node.primaryAxisAlignItems),
      widthMode: this.mapSizingMode(node.layoutSizingHorizontal),
      heightMode: this.mapSizingMode(node.layoutSizingVertical),
      width,
      height,
      computedWidth: this.computeValue(width),
      computedHeight: this.computeValue(height),
      padding,
      computedPadding,
      gap,
      computedGap: this.computeValue(gap),
    };
  }

  private parseStyle(node: any): IRStyle {
    return {
      backgroundColor: this.extractBackgroundColor(node.fills),
      borderRadius: this.extractBorderRadius(node),
      computedBorderRadius: this.extractBorderRadius(node).map((r) =>
        this.computeValue(r)
      ) as [number, number, number, number],
      border: this.extractBorder(node.strokes, node.strokeWeight),
      shadows: this.extractShadows(node.effects),
      opacity: node.opacity ?? 1.0,
      visibility: node.visible === false ? "hidden" : "visible",
    };
  }

  private parseContent(node: any): IRContent {
    const content: IRContent = {};

    if (node.type === "TEXT") {
      content.text = node.characters ?? "";

      const style = node.style ?? {};
      content.typography = this.extractTypography(style);
    }

    if (node.componentProperties?.icon || node.name?.startsWith("icon_")) {
      content.icon = node.name;
    }

    return content;
  }

  // --- Mapping helpers ---

  private mapDirection(layoutMode: string | undefined): "horizontal" | "vertical" {
    if (layoutMode === "HORIZONTAL") return "horizontal";
    return "vertical";
  }

  private mapAlign(counterAxisAlign: string | undefined): string {
    switch (counterAxisAlign) {
      case "MIN": return "flex-start";
      case "MAX": return "flex-end";
      case "CENTER": return "center";
      case "BASELINE": return "baseline";
      default: return "stretch";
    }
  }

  private mapJustify(primaryAxisAlign: string | undefined): string {
    switch (primaryAxisAlign) {
      case "MIN": return "flex-start";
      case "MAX": return "flex-end";
      case "CENTER": return "center";
      case "SPACE_BETWEEN": return "space-between";
      default: return "flex-start";
    }
  }

  private mapSizingMode(sizing: string | undefined): "fixed" | "hug" | "fill" {
    switch (sizing) {
      case "HUG": return "hug";
      case "FILL": return "fill";
      default: return "fixed";
    }
  }

  // --- Extract helpers ---

  private extractBackgroundColor(fills: any[] | undefined): string {
    if (!fills || fills.length === 0) return "transparent";

    const fill = fills.find((f: any) => f.type === "SOLID" && f.visible !== false);
    if (!fill?.color) return "transparent";

    const { r, g, b } = fill.color;
    const a = fill.opacity ?? fill.color.a ?? 1;

    if (a < 1) {
      return `rgba(${Math.round(r * 255)},${Math.round(g * 255)},${Math.round(b * 255)},${Number(a.toFixed(2))})`;
    }

    return (
      "#" +
      [r, g, b]
        .map((c: number) =>
          Math.round(c * 255)
            .toString(16)
            .padStart(2, "0")
        )
        .join("")
        .toUpperCase()
    );
  }

  private extractBorderRadius(
    node: any
  ): [number, number, number, number] {
    if (node.rectangleCornerRadii) {
      const [tl, tr, br, bl] = node.rectangleCornerRadii;
      return [tl, tr, br, bl];
    }
    const r = node.cornerRadius ?? 0;
    return [r, r, r, r];
  }

  private extractBorder(
    strokes: any[] | undefined,
    strokeWeight: number | undefined
  ): IRBorder | null {
    if (!strokes || strokes.length === 0) return null;

    const stroke = strokes.find(
      (s: any) => s.type === "SOLID" && s.visible !== false
    );
    if (!stroke?.color) return null;

    const width = strokeWeight ?? 1;
    return {
      width,
      computedWidth: this.computeValue(width),
      color: this.extractBackgroundColor([stroke]),
      style: "solid",
    };
  }

  private extractShadows(effects: any[] | undefined): IRShadow[] {
    if (!effects) return [];

    return effects
      .filter(
        (e: any) => e.type === "DROP_SHADOW" && e.visible !== false
      )
      .map((e: any) => {
        const x = e.offset?.x ?? 0;
        const y = e.offset?.y ?? 0;
        const blur = e.radius ?? 0;
        const color = e.color
          ? `rgba(${Math.round(e.color.r * 255)},${Math.round(e.color.g * 255)},${Math.round(e.color.b * 255)},${Number((e.color.a ?? 1).toFixed(2))})`
          : "rgba(0,0,0,0.25)";

        return {
          x,
          y,
          blur,
          computedX: this.computeValue(x),
          computedY: this.computeValue(y),
          computedBlur: this.computeValue(blur),
          color,
        };
      });
  }

  private extractTypography(style: any): IRTypography {
    const fontSize = style.fontSize ?? 14;
    const letterSpacing = style.letterSpacing ?? 0;

    return {
      fontFamily: style.fontFamily ?? "Inter",
      fontSize,
      computedFontSize: this.computeValue(fontSize),
      fontWeight: style.fontWeight ?? 400,
      lineHeight: style.lineHeightPercentFontSize
        ? style.lineHeightPercentFontSize / 100
        : style.lineHeight ?? 1.2,
      letterSpacing,
      computedLetterSpacing: this.computeValue(letterSpacing),
    };
  }

  // --- Core compute ---

  private computeValue(value: number): number {
    return Math.round(value * this.scaleFactor);
  }
}
