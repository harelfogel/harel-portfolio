export type LlmProviderId = "claude" | "openai";

export type LlmMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export type LlmGenerateParams = {
  messages: LlmMessage[];
  system?: string;
  temperature?: number;
  maxTokens?: number;
};

export type LlmGenerateResult = {
  text: string;
};

export type LlmConfig = {
  provider: LlmProviderId;
  apiKey: string;
  baseUrl: string;
  model: string;
  temperature: number;
  maxTokens: number;
  timeoutMs: number;
};

export type LlmProvider = {
  id: LlmProviderId;
  generate: (
    params: LlmGenerateParams,
    config: LlmConfig,
  ) => Promise<LlmGenerateResult>;
};
