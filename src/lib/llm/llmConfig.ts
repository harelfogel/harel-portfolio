import type { LlmConfig, LlmProviderId } from "@/lib/llm/types";

const DEFAULTS: Record<
  LlmProviderId,
  { baseUrl: string; model: string }
> = {
  claude: {
    baseUrl: "https://api.anthropic.com/v1/messages",
    model: "claude-3-5-sonnet-20241022",
  },
  openai: {
    baseUrl: "https://api.openai.com/v1/chat/completions",
    model: "gpt-4o-mini",
  },
};

function parseNumber(value: string | undefined, fallback: number): number {
  if (!value) return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function getLlmConfig(): LlmConfig {
  const providerRaw = process.env.LLM_PROVIDER?.toLowerCase();
  const provider =
    providerRaw === "openai" || providerRaw === "claude"
      ? providerRaw
      : "claude";

  const defaults = DEFAULTS[provider];
  const apiKey =
    process.env.LLM_API_KEY ||
    (provider === "claude"
      ? process.env.ANTHROPIC_API_KEY
      : process.env.OPENAI_API_KEY) ||
    "";

  if (!apiKey) {
    throw new Error(
      `Missing API key for ${provider}. Set LLM_API_KEY or a provider-specific key.`,
    );
  }

  const baseUrl = process.env.LLM_BASE_URL || defaults.baseUrl;
  const model = process.env.LLM_MODEL || defaults.model;

  return {
    provider,
    apiKey,
    baseUrl,
    model,
    temperature: parseNumber(process.env.LLM_TEMPERATURE, 0.2),
    maxTokens: parseNumber(process.env.LLM_MAX_TOKENS, 700),
    timeoutMs: parseNumber(process.env.LLM_TIMEOUT_MS, 20000),
  };
}
