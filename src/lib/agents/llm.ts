import { ChatOpenAI } from "@langchain/openai";
import { ChatAnthropic } from "@langchain/anthropic";
import type { BaseChatModel } from "@langchain/core/language_models/chat_models";

export interface LLMProviderConfig {
  id: string;
  label: string;
  provider: "openai" | "anthropic";
  modelName: string;
}

const PROVIDERS: LLMProviderConfig[] = [
  { id: "gpt-4o-mini", label: "GPT-4o Mini", provider: "openai", modelName: "gpt-4o-mini" },
  { id: "gpt-4o", label: "GPT-4o", provider: "openai", modelName: "gpt-4o" },
  { id: "claude-sonnet", label: "Claude Sonnet", provider: "anthropic", modelName: "claude-sonnet-4-20250514" },
];

const API_KEY_ENV: Record<string, string> = {
  openai: "OPENAI_API_KEY",
  anthropic: "ANTHROPIC_API_KEY",
};

/**
 * Returns providers whose required API key is set.
 */
export function getAvailableProviders(): LLMProviderConfig[] {
  return PROVIDERS.filter((p) => !!process.env[API_KEY_ENV[p.provider]]);
}

/**
 * Creates an LLM instance for the given provider and temperature.
 */
export function createLLM(providerId: string, temperature = 0): BaseChatModel {
  const config = PROVIDERS.find((p) => p.id === providerId);
  if (!config) throw new Error(`Unknown LLM provider: ${providerId}`);

  switch (config.provider) {
    case "openai":
      return new ChatOpenAI({ modelName: config.modelName, temperature });
    case "anthropic":
      return new ChatAnthropic({ modelName: config.modelName, temperature });
    default:
      throw new Error(`Unsupported provider type: ${config.provider}`);
  }
}
