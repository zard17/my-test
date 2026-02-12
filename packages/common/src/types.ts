// Standard IR interfaces for F2C engine
// Figma JSON → Standard IR 중간 표현 구조

export interface IRMetadata {
  version: string;
  scaleFactor: number;
  unit: "px";
}

export interface IRIdentity {
  id: string;
  name: string;
  type: string;
}

export interface IRPadding {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export interface IRLayout {
  display: "flex" | "none";
  direction: "horizontal" | "vertical";
  align: string;
  justify: string;
  widthMode: "fixed" | "hug" | "fill";
  heightMode: "fixed" | "hug" | "fill";
  width: number;
  height: number;
  computedWidth: number;
  computedHeight: number;
  padding: IRPadding;
  computedPadding: IRPadding;
  gap: number;
  computedGap: number;
}

export interface IRBorder {
  width: number;
  computedWidth: number;
  color: string;
  style: "solid" | "dashed" | "none";
}

export interface IRShadow {
  x: number;
  y: number;
  blur: number;
  computedX: number;
  computedY: number;
  computedBlur: number;
  color: string;
}

export interface IRStyle {
  backgroundColor: string;
  borderRadius: [number, number, number, number];
  computedBorderRadius: [number, number, number, number];
  border: IRBorder | null;
  shadows: IRShadow[];
  opacity: number;
  visibility: "visible" | "hidden";
}

export interface IRTypography {
  fontFamily: string;
  fontSize: number;
  computedFontSize: number;
  fontWeight: number;
  lineHeight: number;
  letterSpacing: number;
  computedLetterSpacing: number;
}

export interface IRContent {
  text?: string;
  typography?: IRTypography;
  icon?: string;
}

export interface IRNode {
  identity: IRIdentity;
  layout: IRLayout;
  style: IRStyle;
  content: IRContent;
  children: IRNode[];
}

export interface StandardIR {
  metadata: IRMetadata;
  nodes: IRNode[];
}
