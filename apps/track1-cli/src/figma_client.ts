import fs from "node:fs";
import path from "node:path";

const FIGMA_API_BASE = "https://api.figma.com/v1";

export interface FigmaClientOptions {
  accessToken: string;
  cacheDir?: string;
}

export class FigmaClient {
  private accessToken: string;
  private cacheDir: string;

  constructor(options: FigmaClientOptions) {
    this.accessToken = options.accessToken;
    this.cacheDir = options.cacheDir ?? ".cache";
  }

  /**
   * Fetch JSON data for specific node(s) from a Figma file and cache locally.
   */
  async getNodeData(
    fileKey: string,
    nodeId: string
  ): Promise<any> {
    const cacheFile = this.getCachePath(fileKey, nodeId, "json");
    const cached = this.readCache(cacheFile);
    if (cached) return JSON.parse(cached);

    const url = `${FIGMA_API_BASE}/files/${fileKey}/nodes?ids=${encodeURIComponent(nodeId)}`;
    const data = await this.request(url);

    this.ensureCacheDir();
    fs.writeFileSync(cacheFile, JSON.stringify(data, null, 2), "utf-8");

    return data;
  }

  /**
   * Fetch a rendered PNG image of a node and download it locally.
   * Returns the local file path of the saved image.
   */
  async getNodeImage(
    fileKey: string,
    nodeId: string,
    scale: number = 4
  ): Promise<string> {
    const cacheFile = this.getCachePath(fileKey, nodeId, "png");
    if (fs.existsSync(cacheFile)) return cacheFile;

    // Step 1: Request render URL from Figma
    const url = `${FIGMA_API_BASE}/images/${fileKey}?ids=${encodeURIComponent(nodeId)}&scale=${scale}&format=png`;
    const data = await this.request(url);

    const imageUrl = data.images?.[nodeId];
    if (!imageUrl) {
      throw new Error(`No image URL returned for node ${nodeId}`);
    }

    // Step 2: Download the actual PNG
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      throw new Error(`Failed to download image: ${imageResponse.status}`);
    }

    const buffer = Buffer.from(await imageResponse.arrayBuffer());
    this.ensureCacheDir();
    fs.writeFileSync(cacheFile, buffer);

    return cacheFile;
  }

  // --- Internal helpers ---

  private async request(url: string): Promise<any> {
    const response = await fetch(url, {
      headers: {
        "X-Figma-Token": this.accessToken,
      },
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(
        `Figma API error ${response.status}: ${body}`
      );
    }

    return response.json();
  }

  private getCachePath(
    fileKey: string,
    nodeId: string,
    ext: string
  ): string {
    const safeNodeId = nodeId.replace(/:/g, "_");
    return path.join(this.cacheDir, `${fileKey}_${safeNodeId}.${ext}`);
  }

  private readCache(filePath: string): string | null {
    try {
      return fs.readFileSync(filePath, "utf-8");
    } catch {
      return null;
    }
  }

  private ensureCacheDir(): void {
    if (!fs.existsSync(this.cacheDir)) {
      fs.mkdirSync(this.cacheDir, { recursive: true });
    }
  }
}
