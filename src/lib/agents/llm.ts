import { ChatOpenAI } from "@langchain/openai";
import { ChatAnthropic } from "@langchain/anthropic";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import type { BaseChatModel } from "@langchain/core/language_models/chat_models";
import type { LLMProviderConfig } from "./types";

const PROVIDERS: LLMProviderConfig[] = [
  { id: "gpt-4o-mini", label: "GPT-4o Mini", provider: "openai", modelName: "gpt-4o-mini" },
  { id: "gpt-4o", label: "GPT-4o", provider: "openai", modelName: "gpt-4o" },
  { id: "claude-sonnet", label: "Claude Sonnet", provider: "anthropic", modelName: "claude-sonnet-4-20250514" },
  { id: "gemini-2.0-flash", label: "Gemini 2.0 Flash", provider: "google", modelName: "gemini-2.0-flash" },
  { id: "gemini-2.5-pro", label: "Gemini 2.5 Pro", provider: "google", modelName: "gemini-2.5-pro-preview-06-05" },
];

const API_KEY_ENV: Record<string, string> = {
  openai: "OPENAI_API_KEY",
  anthropic: "ANTHROPIC_API_KEY",
  google: "GOOGLE_API_KEY",
};

/**
 * Returns providers whose required API key is set.
 */
export function getAvailableProviders(): LLMProviderConfig[] {
  return PROVIDERS.filter((p) => !!process.env[API_KEY_ENV[p.provider]]);
}

/**
 * Returns the human-readable label for a provider ID.
 */
export function getProviderLabel(providerId: string): string {
  return PROVIDERS.find((p) => p.id === providerId)?.label ?? providerId;
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
    case "google":
      return new ChatGoogleGenerativeAI({ model: config.modelName, temperature });
    default:
      throw new Error(`Unsupported provider type: ${config.provider}`);
  }
}
