import dotenv from "dotenv";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { FigmaClient } from "./figma_client.js";
import { F2CParser } from "@f2c/core";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../.env") });

const accessToken = process.env.FIGMA_ACCESS_TOKEN;
const fileKey = process.env.TEST_FILE_KEY;

if (!accessToken || !fileKey) {
  console.error("Missing FIGMA_ACCESS_TOKEN or TEST_FILE_KEY in .env");
  process.exit(1);
}

// node-id는 CLI 인자로 받거나 기본값 사용
const nodeId = process.argv[2] ?? "0:1";

console.log(`\n--- Figma Data Fetch ---`);
console.log(`File: ${fileKey}`);
console.log(`Node: ${nodeId}\n`);

const client = new FigmaClient({ accessToken });

// 1. JSON 데이터 획득
console.log("[1/3] Fetching node data...");
const data = await client.getNodeData(fileKey, nodeId);
const nodeData = data.nodes?.[nodeId]?.document;

if (!nodeData) {
  console.error("Node not found. Available nodes:", Object.keys(data.nodes ?? {}));
  process.exit(1);
}

console.log(`  OK: "${nodeData.name}" (${nodeData.type}), children: ${nodeData.children?.length ?? 0}`);

// 2. IR 변환
console.log("[2/3] Parsing to Standard IR...");
const parser = new F2CParser();
const ir = parser.parse(nodeData);

console.log(`  OK: ${ir.nodes.length} root node(s), scaleFactor: ${ir.metadata.scaleFactor}`);
console.log(`\n--- Standard IR Output ---`);
console.log(JSON.stringify(ir, null, 2));

// 3. 이미지 다운로드
console.log(`\n[3/3] Downloading node image...`);
const imagePath = await client.getNodeImage(fileKey, nodeId);
console.log(`  OK: saved to ${imagePath}`);

console.log("\nDone!");
