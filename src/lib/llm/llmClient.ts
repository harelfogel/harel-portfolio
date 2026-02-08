import type { LlmGenerateParams, LlmGenerateResult } from "@/lib/llm/types";
import { getLlmConfig } from "@/lib/llm/llmConfig";
import { claudeProvider } from "@/lib/llm/providers/claude";
import { openAiProvider } from "@/lib/llm/providers/openai";

const providers = {
  claude: claudeProvider,
  openai: openAiProvider,
};

export type LlmRunResult = LlmGenerateResult & {
  provider: "claude" | "openai";
  model: string;
};

export async function generateText(
  params: LlmGenerateParams,
): Promise<LlmRunResult> {
  const config = getLlmConfig();
  const provider = providers[config.provider];

  if (!provider) {
    throw new Error(`Unsupported LLM provider: ${config.provider}`);
  }

  const result = await provider.generate(params, config);
  return { ...result, provider: config.provider, model: config.model };
}
