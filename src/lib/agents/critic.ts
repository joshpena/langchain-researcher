import { ChatPromptTemplate } from "@langchain/core/prompts";
import { RunnableSequence } from "@langchain/core/runnables";
import { StructuredOutputParser } from "@langchain/core/output_parsers";
import { z } from "zod";
import { createLLM } from "./llm";
import type { CriticFeedback, ResearchResult } from "./types";

const outputSchema = z.object({
  passed: z.boolean().describe("Whether the research is sufficient"),
  gaps: z
    .array(z.string())
    .describe("Knowledge gaps that still need to be addressed"),
  suggestions: z
    .array(z.string())
    .describe("Additional questions to research if gaps exist"),
});

const parser = StructuredOutputParser.fromZodSchema(outputSchema);

const prompt = ChatPromptTemplate.fromMessages([
  [
    "system",
    `You are a critical research reviewer. Evaluate the research results for
completeness, accuracy, and depth. Determine if the results are sufficient to
write a comprehensive report on the original topic.

Be constructive but thorough. Only fail the review if there are significant gaps.
Minor gaps can be noted but should still pass.

{format_instructions}`,
  ],
  [
    "human",
    `Original topic: {topic}

Research results:
{results}

Evaluate whether these results are sufficient for a comprehensive report:`,
  ],
]);

/**
 * Critic Agent: reviews research results and identifies gaps.
 * If gaps are found, returns suggestions for additional research.
 * The orchestrator can loop back to the Researcher with these suggestions.
 */
export async function critiqueResearch(
  topic: string,
  results: ResearchResult[]
): Promise<CriticFeedback> {
  const formattedResults = results
    .map(
      (r) =>
        `## Q: ${r.question}\n\n${r.answer}\n\nSources: ${r.sources.map((s) => s.url).join(", ")}`
    )
    .join("\n\n---\n\n");

  const chain = RunnableSequence.from([prompt, createLLM(0.1), parser]);

  return chain.invoke({
    topic,
    results: formattedResults,
    format_instructions: parser.getFormatInstructions(),
  });
}
