import dotenv from "dotenv";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { Generator } from "./generator.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../.env") });

const accessToken = process.env.FIGMA_ACCESS_TOKEN;
const fileKey = process.env.TEST_FILE_KEY;
const openaiKey = process.env.OPENAI_API_KEY;

if (!accessToken || !fileKey) {
  console.error("Missing FIGMA_ACCESS_TOKEN or TEST_FILE_KEY in .env");
  process.exit(1);
}

if (!openaiKey) {
  console.error("Missing OPENAI_API_KEY in .env");
  process.exit(1);
}

const nodeId = process.argv[2];
if (!nodeId) {
  console.error('Usage: npx tsx apps/track1-cli/src/generate.ts "310:5549"');
  process.exit(1);
}

const model = process.env.OPENAI_MODEL ?? "gpt-4o-mini";
const baseURL = process.env.OPENAI_BASE_URL;

const generator = new Generator({
  figma: { accessToken, fileKey },
  llm: { apiKey: openaiKey, baseURL, model },
});

console.log(`\n[1/3] Fetching & parsing Figma node...`);
const ir = await generator.fetchAndParse(nodeId);
console.log(
  `  OK: ${ir.nodes.length} root node(s), ${countNodes(ir.nodes)} total nodes`
);

console.log(`[2/3] Generating code via LLM (${model})...`);
const result = await generator.generateCode(ir);
console.log(`  OK: received ${result.code.length} chars`);

console.log(`[3/3] Saving output...`);
const outputPath = generator.saveOutput(nodeId, result.code);

console.log(`
Model: ${result.model}
Tokens: ${result.usage.promptTokens} prompt + ${result.usage.completionTokens} completion = ${result.usage.totalTokens} total
Output: ${outputPath}

Done! Open the file in a browser to preview.`);

function countNodes(nodes: any[]): number {
  let count = 0;
  for (const node of nodes) {
    count += 1;
    if (node.children) {
      count += countNodes(node.children);
    }
  }
  return count;
}
