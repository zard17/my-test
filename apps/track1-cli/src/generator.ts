import fs from "node:fs";
import path from "node:path";
import type { StandardIR } from "@f2c/common";
import { F2CParser } from "@f2c/core";
import { FigmaClient, type FigmaClientOptions } from "./figma_client.js";
import { LLMClient, type LLMClientOptions, type LLMResult } from "./llm_client.js";
import { serializeIR } from "./prompts/ir_serializer.js";
import { buildSystemPrompt, buildUserMessage } from "./prompts/system_prompt.js";

export interface GeneratorOptions {
  figma: FigmaClientOptions & { fileKey: string };
  llm: LLMClientOptions;
  outputDir?: string;
}

export class Generator {
  private figmaClient: FigmaClient;
  private parser: F2CParser;
  private llmClient: LLMClient;
  private fileKey: string;
  private outputDir: string;

  constructor(options: GeneratorOptions) {
    this.figmaClient = new FigmaClient({
      accessToken: options.figma.accessToken,
      cacheDir: options.figma.cacheDir,
    });
    this.parser = new F2CParser();
    this.llmClient = new LLMClient(options.llm);
    this.fileKey = options.figma.fileKey;
    this.outputDir = options.outputDir ?? ".output";
  }

  async fetchAndParse(nodeId: string): Promise<StandardIR> {
    const data = await this.figmaClient.getNodeData(this.fileKey, nodeId);
    const nodeData = data.nodes?.[nodeId]?.document;

    if (!nodeData) {
      const available = Object.keys(data.nodes ?? {});
      throw new Error(
        `Node "${nodeId}" not found. Available: ${available.join(", ")}`
      );
    }

    return this.parser.parse(nodeData);
  }

  async generateCode(ir: StandardIR): Promise<LLMResult> {
    const serialized = serializeIR(ir);
    const systemPrompt = buildSystemPrompt();
    const userMessage = buildUserMessage(serialized);

    return this.llmClient.generate({ systemPrompt, userMessage });
  }

  saveOutput(nodeId: string, html: string): string {
    const safeId = nodeId.replace(/:/g, "_");
    const filePath = path.resolve(this.outputDir, `${safeId}.html`);

    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }

    fs.writeFileSync(filePath, html, "utf-8");
    return filePath;
  }
}
