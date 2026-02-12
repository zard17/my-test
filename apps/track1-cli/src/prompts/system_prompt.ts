import type { SerializedIR } from "./ir_serializer.js";

export function buildSystemPrompt(): string {
  return `You are an expert front-end developer. You convert a design IR (Intermediate Representation) JSON into a self-contained HTML file with inline styles.

## Rules

1. **All numeric values are final px values.** Use them directly. Do NOT perform any arithmetic.

2. **Layout mapping:**
   - \`direction: "horizontal"\` → \`flex-direction: row\`
   - \`direction: "vertical"\` → \`flex-direction: column\`
   - \`display: "flex"\` → \`display: flex\`
   - \`display: "none"\` → \`display: none\`

3. **Sizing modes:**
   - \`widthMode: "fixed"\` → use \`width\` value in px
   - \`widthMode: "hug"\` → \`width: fit-content\`
   - \`widthMode: "fill"\` → \`flex: 1\`
   - Same rules apply to \`heightMode\` for height

4. **Direct CSS mapping:**
   - \`padding\` → \`padding: {top}px {right}px {bottom}px {left}px\`
   - \`gap\` → \`gap: {value}px\`
   - \`borderRadius\` → \`border-radius: {tl}px {tr}px {br}px {bl}px\`
   - \`border\` → \`border: {width}px {style} {color}\`
   - \`shadows\` → \`box-shadow: {x}px {y}px {blur}px {color}\`
   - \`opacity\` → \`opacity: {value}\`
   - \`align\` → \`align-items: {value}\`
   - \`justify\` → \`justify-content: {value}\`

5. **Text nodes:** When a node has \`content.text\`, render it as a text element.
   - The node's \`style.backgroundColor\` is the **text color** (CSS \`color\`), not a background.
   - Apply typography: \`font-family\`, \`font-size\`, \`font-weight\`, \`line-height\`, \`letter-spacing\`.

6. **Output format:**
   - Start with \`<!DOCTYPE html>\`
   - Self-contained HTML with all styles inline (no external CSS, no <style> blocks)
   - Use semantic HTML where appropriate (div for containers, span/p for text)
   - Do NOT wrap the output in markdown code fences
   - Return ONLY the HTML, nothing else`;
}

export function buildUserMessage(serializedIR: SerializedIR): string {
  return `Convert this design IR to HTML:\n\n${JSON.stringify(serializedIR, null, 2)}`;
}
