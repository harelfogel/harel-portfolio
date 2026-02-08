import type {
  LlmConfig,
  LlmGenerateParams,
  LlmGenerateResult,
  LlmProvider,
} from "@/lib/llm/types";

async function generateOpenAi(
  params: LlmGenerateParams,
  config: LlmConfig,
): Promise<LlmGenerateResult> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), config.timeoutMs);
  const messages = [...params.messages];

  if (params.system) {
    messages.unshift({ role: "system", content: params.system });
  }

  try {
    const res = await fetch(config.baseUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        model: config.model,
        messages,
        max_tokens: params.maxTokens ?? config.maxTokens,
        temperature: params.temperature ?? config.temperature,
      }),
      signal: controller.signal,
    });

    const data = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
      error?: { message?: string };
    };

    if (!res.ok) {
      const message = data?.error?.message || `OpenAI request failed (${res.status}).`;
      throw new Error(message);
    }

    const text = data.choices?.[0]?.message?.content || "";
    return { text: text.trim() };
  } finally {
    clearTimeout(timeout);
  }
}

export const openAiProvider: LlmProvider = {
  id: "openai",
  generate: generateOpenAi,
};
