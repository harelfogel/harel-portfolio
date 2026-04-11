import type {
  LlmConfig,
  LlmGenerateParams,
  LlmGenerateResult,
  LlmProvider,
  LlmMessage,
} from "@/lib/llm/types";

const FALLBACK_CLAUDE_MODELS = [
  "claude-sonnet-4-20250514",
  "claude-3-7-sonnet-20250219",
  "claude-3-7-sonnet-latest",
  "claude-3-5-sonnet-20241022",
  "claude-3-5-haiku-20241022",
  "claude-3-haiku-20240307",
];

function splitSystem(
  messages: LlmMessage[],
  explicitSystem?: string,
): { system: string; messages: LlmMessage[] } {
  const systemParts = [explicitSystem];
  const nonSystemMessages: LlmMessage[] = [];

  for (const message of messages) {
    if (message.role === "system") {
      systemParts.push(message.content);
    } else {
      nonSystemMessages.push(message);
    }
  }

  return {
    system: systemParts.filter(Boolean).join("\n\n"),
    messages: nonSystemMessages,
  };
}

function isModelError(message: string): boolean {
  return message.toLowerCase().includes("model:");
}

async function generateClaude(
  params: LlmGenerateParams,
  config: LlmConfig,
): Promise<LlmGenerateResult> {
  const { system, messages } = splitSystem(params.messages, params.system);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), config.timeoutMs);
  const candidateModels = [
    config.model,
    ...FALLBACK_CLAUDE_MODELS.filter((model) => model !== config.model),
  ];
  const modelErrors: string[] = [];

  try {
    for (const model of candidateModels) {
      const res = await fetch(config.baseUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": config.apiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model,
          max_tokens: params.maxTokens ?? config.maxTokens,
          temperature: params.temperature ?? config.temperature,
          system,
          messages: messages.map((m) => ({ role: m.role, content: m.content })),
        }),
        signal: controller.signal,
      });

      let data: {
        content?: Array<{ type: string; text?: string }>;
        error?: { message?: string };
      } = {};
      try {
        data = (await res.json()) as typeof data;
      } catch {
        data = {};
      }

      if (!res.ok) {
        const message =
          data?.error?.message || `Claude request failed (${res.status}).`;

        if (!isModelError(message)) {
          throw new Error(message);
        }

        modelErrors.push(`${model}: ${message}`);
        continue;
      }

      const text =
        data.content
          ?.filter((block) => block.type === "text")
          .map((block) => block.text)
          .filter(Boolean)
          .join("") || "";

      return { text: text.trim() };
    }

    throw new Error(
      `No accessible Claude model found for this API key. Tried: ${candidateModels.join(", ")}. Set LLM_MODEL in .env to a model your Anthropic account can access. Provider errors: ${modelErrors.join(" | ")}`,
    );
  } finally {
    clearTimeout(timeout);
  }
}

export const claudeProvider: LlmProvider = {
  id: "claude",
  generate: generateClaude,
};
