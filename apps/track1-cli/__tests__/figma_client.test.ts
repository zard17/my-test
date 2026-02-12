import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import fs from "node:fs";
import { FigmaClient } from "../src/figma_client.js";

const TEST_TOKEN = "test-token-123";
const TEST_FILE_KEY = "abc123";
const TEST_NODE_ID = "1:100";
const CACHE_DIR = ".cache-test";

function createClient() {
  return new FigmaClient({
    accessToken: TEST_TOKEN,
    cacheDir: CACHE_DIR,
  });
}

describe("FigmaClient", () => {
  beforeEach(() => {
    // Clean test cache
    if (fs.existsSync(CACHE_DIR)) {
      fs.rmSync(CACHE_DIR, { recursive: true });
    }
  });

  afterEach(() => {
    vi.restoreAllMocks();
    if (fs.existsSync(CACHE_DIR)) {
      fs.rmSync(CACHE_DIR, { recursive: true });
    }
  });

  describe("getNodeData", () => {
    it("should fetch node data from Figma API with correct headers", async () => {
      const mockData = {
        nodes: { "1:100": { document: { id: "1:100", name: "Test" } } },
      };

      const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
        new Response(JSON.stringify(mockData), { status: 200 })
      );

      const client = createClient();
      const result = await client.getNodeData(TEST_FILE_KEY, TEST_NODE_ID);

      expect(result).toEqual(mockData);
      expect(fetchSpy).toHaveBeenCalledOnce();

      const [url, options] = fetchSpy.mock.calls[0];
      expect(url).toContain(`/files/${TEST_FILE_KEY}/nodes`);
      expect(url).toContain("ids=1%3A100");
      expect((options as RequestInit).headers).toEqual({
        "X-Figma-Token": TEST_TOKEN,
      });
    });

    it("should cache node data and return cached on second call", async () => {
      const mockData = { nodes: { "1:100": { id: "1:100" } } };
      const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
        new Response(JSON.stringify(mockData), { status: 200 })
      );

      const client = createClient();

      // First call - fetches from API
      const result1 = await client.getNodeData(TEST_FILE_KEY, TEST_NODE_ID);
      expect(fetchSpy).toHaveBeenCalledOnce();

      // Second call - returns from cache
      const result2 = await client.getNodeData(TEST_FILE_KEY, TEST_NODE_ID);
      expect(fetchSpy).toHaveBeenCalledOnce(); // still only 1 call
      expect(result2).toEqual(result1);
    });

    it("should throw on API error", async () => {
      vi.spyOn(globalThis, "fetch").mockResolvedValue(
        new Response("Forbidden", { status: 403 })
      );

      const client = createClient();
      await expect(
        client.getNodeData(TEST_FILE_KEY, TEST_NODE_ID)
      ).rejects.toThrow("Figma API error 403");
    });
  });

  describe("getNodeImage", () => {
    it("should fetch image URL then download the PNG", async () => {
      const imageUrl = "https://figma-alpha-api.s3.us-west-2.amazonaws.com/images/test.png";
      const mockImageData = {
        images: { [TEST_NODE_ID]: imageUrl },
      };
      const pngBytes = new Uint8Array([0x89, 0x50, 0x4e, 0x47]); // PNG magic bytes

      const fetchSpy = vi.spyOn(globalThis, "fetch")
        .mockResolvedValueOnce(
          new Response(JSON.stringify(mockImageData), { status: 200 })
        )
        .mockResolvedValueOnce(
          new Response(pngBytes, { status: 200 })
        );

      const client = createClient();
      const filePath = await client.getNodeImage(TEST_FILE_KEY, TEST_NODE_ID);

      // Should have made 2 fetch calls (API + image download)
      expect(fetchSpy).toHaveBeenCalledTimes(2);

      // First call is the Figma images API
      expect(fetchSpy.mock.calls[0][0]).toContain(`/images/${TEST_FILE_KEY}`);

      // File should be saved
      expect(fs.existsSync(filePath)).toBe(true);
      expect(filePath).toContain(".png");
    });

    it("should return cached image path on second call", async () => {
      const imageUrl = "https://example.com/test.png";
      const mockImageData = { images: { [TEST_NODE_ID]: imageUrl } };
      const pngBytes = new Uint8Array([0x89, 0x50, 0x4e, 0x47]);

      const fetchSpy = vi.spyOn(globalThis, "fetch")
        .mockResolvedValueOnce(
          new Response(JSON.stringify(mockImageData), { status: 200 })
        )
        .mockResolvedValueOnce(
          new Response(pngBytes, { status: 200 })
        );

      const client = createClient();
      const path1 = await client.getNodeImage(TEST_FILE_KEY, TEST_NODE_ID);
      const path2 = await client.getNodeImage(TEST_FILE_KEY, TEST_NODE_ID);

      // Only 2 fetch calls from first invocation; second is cached
      expect(fetchSpy).toHaveBeenCalledTimes(2);
      expect(path1).toBe(path2);
    });

    it("should throw when no image URL is returned", async () => {
      vi.spyOn(globalThis, "fetch").mockResolvedValue(
        new Response(JSON.stringify({ images: {} }), { status: 200 })
      );

      const client = createClient();
      await expect(
        client.getNodeImage(TEST_FILE_KEY, TEST_NODE_ID)
      ).rejects.toThrow("No image URL returned");
    });
  });
});
