import { ChatOpenAI } from "@langchain/openai";
import { ChatAnthropic } from "@langchain/anthropic";
import type { BaseChatModel } from "@langchain/core/language_models/chat_models";
import type { BaseCallbackHandler } from "@langchain/core/callbacks/base";
import type { LLMProviderConfig } from "./types";

const PROVIDERS: LLMProviderConfig[] = [
  { id: "gpt-4o-mini", label: "GPT-4o Mini", provider: "openai", modelName: "gpt-4o-mini" },
  { id: "gpt-4o", label: "GPT-4o", provider: "openai", modelName: "gpt-4o" },
  { id: "claude-sonnet", label: "Claude Sonnet", provider: "anthropic", modelName: "claude-sonnet-4-20250514" },
];

const callbackRegistry = new Map<string, BaseCallbackHandler[]>();

export function registerCallbacks(providerId: string, callbacks: BaseCallbackHandler[]): void {
  callbackRegistry.set(providerId, callbacks);
}

export function clearCallbacks(providerId: string): void {
  callbackRegistry.delete(providerId);
}

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
 * Returns the human-readable label for a provider ID.
 */
export function getProviderLabel(providerId: string): string {
  return PROVIDERS.find((p) => p.id === providerId)?.label ?? providerId;
}

/**
 * Returns the model name for a provider ID.
 */
export function getModelName(providerId: string): string {
  return PROVIDERS.find((p) => p.id === providerId)?.modelName ?? providerId;
}

/**
 * Creates an LLM instance for the given provider and temperature.
 */
export function createLLM(providerId: string, temperature = 0): BaseChatModel {
  const config = PROVIDERS.find((p) => p.id === providerId);
  if (!config) throw new Error(`Unknown LLM provider: ${providerId}`);

  const callbacks = callbackRegistry.get(providerId);

  switch (config.provider) {
    case "openai":
      return new ChatOpenAI({ modelName: config.modelName, temperature, callbacks });
    case "anthropic":
      return new ChatAnthropic({ modelName: config.modelName, temperature, callbacks });
    default:
      throw new Error(`Unsupported provider type: ${config.provider}`);
  }
}
