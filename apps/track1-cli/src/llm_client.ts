import OpenAI from "openai";

export interface LLMClientOptions {
  apiKey: string;
  model?: string;
}

export interface LLMResult {
  code: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  model: string;
}

export class LLMClient {
  private client: OpenAI;
  private model: string;

  constructor(options: LLMClientOptions) {
    this.client = new OpenAI({
      apiKey: options.apiKey,
      maxRetries: 3,
      timeout: 120_000,
    });
    this.model = options.model ?? "gpt-4o";
  }

  async generate(options: {
    systemPrompt: string;
    userMessage: string;
  }): Promise<LLMResult> {
    const response = await this.client.chat.completions.create({
      model: this.model,
      temperature: 0.2,
      messages: [
        { role: "system", content: options.systemPrompt },
        { role: "user", content: options.userMessage },
      ],
    });

    const choice = response.choices[0];
    const raw = choice?.message?.content ?? "";
    const code = stripCodeFences(raw);

    return {
      code,
      usage: {
        promptTokens: response.usage?.prompt_tokens ?? 0,
        completionTokens: response.usage?.completion_tokens ?? 0,
        totalTokens: response.usage?.total_tokens ?? 0,
      },
      model: response.model,
    };
  }
}

export function stripCodeFences(text: string): string {
  // Remove ```html ... ``` or ``` ... ``` wrapping
  const fencePattern = /^```(?:html)?\s*\n?([\s\S]*?)\n?\s*```$/;
  const match = text.trim().match(fencePattern);
  if (match) {
    return match[1].trim();
  }
  return text.trim();
}
