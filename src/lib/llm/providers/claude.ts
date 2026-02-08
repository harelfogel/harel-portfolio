import type {
  LlmConfig,
  LlmGenerateParams,
  LlmGenerateResult,
  LlmProvider,
  LlmMessage,
} from "@/lib/llm/types";

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

async function generateClaude(
  params: LlmGenerateParams,
  config: LlmConfig,
): Promise<LlmGenerateResult> {
  const { system, messages } = splitSystem(params.messages, params.system);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), config.timeoutMs);

  try {
    const res = await fetch(config.baseUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": config.apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: config.model,
        max_tokens: params.maxTokens ?? config.maxTokens,
        temperature: params.temperature ?? config.temperature,
        system,
        messages: messages.map((m) => ({ role: m.role, content: m.content })),
      }),
      signal: controller.signal,
    });

    const data = (await res.json()) as {
      content?: Array<{ type: string; text?: string }>;
      error?: { message?: string };
    };

    if (!res.ok) {
      const message = data?.error?.message || `Claude request failed (${res.status}).`;
      throw new Error(message);
    }

    const text =
      data.content
        ?.filter((block) => block.type === "text")
        .map((block) => block.text)
        .filter(Boolean)
        .join("") ||
      "";

    return { text: text.trim() };
  } finally {
    clearTimeout(timeout);
  }
}

export const claudeProvider: LlmProvider = {
  id: "claude",
  generate: generateClaude,
};
