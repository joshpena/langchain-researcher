import { ChatOpenAI } from "@langchain/openai";

/**
 * Shared LLM instance for all agents.
 * Uses gpt-4o-mini for speed and cost efficiency during development.
 * Switch to gpt-4o for higher quality results.
 */
export function createLLM(temperature = 0) {
  return new ChatOpenAI({
    modelName: "gpt-4o-mini",
    temperature,
  });
}
