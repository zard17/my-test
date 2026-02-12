import { describe, it, expect, vi, beforeEach } from "vitest";
import { stripCodeFences } from "../src/llm_client.js";

const mockCreate = vi.fn();

vi.mock("openai", () => {
  return {
    default: class MockOpenAI {
      chat = {
        completions: {
          create: mockCreate,
        },
      };
    },
  };
});

// Import after mock is set up
const { LLMClient } = await import("../src/llm_client.js");

describe("LLMClient", () => {
  let client: InstanceType<typeof LLMClient>;

  beforeEach(() => {
    vi.clearAllMocks();
    client = new LLMClient({ apiKey: "test-key" });
  });

  it("should return code and usage on successful response", async () => {
    mockCreate.mockResolvedValueOnce({
      choices: [{ message: { content: "<!DOCTYPE html><html></html>" } }],
      usage: { prompt_tokens: 100, completion_tokens: 50, total_tokens: 150 },
      model: "gpt-4o-2024-08-06",
    });

    const result = await client.generate({
      systemPrompt: "system",
      userMessage: "user",
    });

    expect(result.code).toBe("<!DOCTYPE html><html></html>");
    expect(result.usage).toEqual({
      promptTokens: 100,
      completionTokens: 50,
      totalTokens: 150,
    });
    expect(result.model).toBe("gpt-4o-2024-08-06");
  });

  it("should handle empty response content", async () => {
    mockCreate.mockResolvedValueOnce({
      choices: [{ message: { content: "" } }],
      usage: { prompt_tokens: 100, completion_tokens: 0, total_tokens: 100 },
      model: "gpt-4o",
    });

    const result = await client.generate({
      systemPrompt: "system",
      userMessage: "user",
    });

    expect(result.code).toBe("");
  });

  it("should handle null response content", async () => {
    mockCreate.mockResolvedValueOnce({
      choices: [{ message: { content: null } }],
      usage: { prompt_tokens: 100, completion_tokens: 0, total_tokens: 100 },
      model: "gpt-4o",
    });

    const result = await client.generate({
      systemPrompt: "system",
      userMessage: "user",
    });

    expect(result.code).toBe("");
  });

  it("should strip code fences from response", async () => {
    const html = "<!DOCTYPE html>\n<html><body>Hello</body></html>";
    mockCreate.mockResolvedValueOnce({
      choices: [{ message: { content: "```html\n" + html + "\n```" } }],
      usage: { prompt_tokens: 100, completion_tokens: 50, total_tokens: 150 },
      model: "gpt-4o",
    });

    const result = await client.generate({
      systemPrompt: "system",
      userMessage: "user",
    });

    expect(result.code).toBe(html);
  });

  it("should propagate API errors", async () => {
    mockCreate.mockRejectedValueOnce(new Error("API rate limit exceeded"));

    await expect(
      client.generate({ systemPrompt: "system", userMessage: "user" })
    ).rejects.toThrow("API rate limit exceeded");
  });

  it("should handle missing usage data", async () => {
    mockCreate.mockResolvedValueOnce({
      choices: [{ message: { content: "<html></html>" } }],
      usage: undefined,
      model: "gpt-4o",
    });

    const result = await client.generate({
      systemPrompt: "system",
      userMessage: "user",
    });

    expect(result.usage).toEqual({
      promptTokens: 0,
      completionTokens: 0,
      totalTokens: 0,
    });
  });
});

describe("stripCodeFences", () => {
  it("should strip ```html fences", () => {
    const input = "```html\n<div>hello</div>\n```";
    expect(stripCodeFences(input)).toBe("<div>hello</div>");
  });

  it("should strip plain ``` fences", () => {
    const input = "```\n<div>hello</div>\n```";
    expect(stripCodeFences(input)).toBe("<div>hello</div>");
  });

  it("should return plain text unchanged", () => {
    const input = "<!DOCTYPE html><html></html>";
    expect(stripCodeFences(input)).toBe(input);
  });

  it("should handle whitespace around fences", () => {
    const input = "  ```html\n  <div>test</div>\n  ```  ";
    expect(stripCodeFences(input)).toBe("<div>test</div>");
  });
});
