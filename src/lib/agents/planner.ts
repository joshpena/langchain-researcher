import { ChatPromptTemplate } from "@langchain/core/prompts";
import { RunnableSequence } from "@langchain/core/runnables";
import { StructuredOutputParser } from "@langchain/core/output_parsers";
import { z } from "zod";
import { createLLM } from "./llm";
import type { SubQuestion } from "./types";

const outputSchema = z.object({
  sub_questions: z.array(
    z.object({
      id: z.number(),
      question: z.string(),
    })
  ),
});

const parser = StructuredOutputParser.fromZodSchema(outputSchema);

const prompt = ChatPromptTemplate.fromMessages([
  [
    "system",
    `You are a research planning agent. Given a topic, break it down into 3-5
focused sub-questions that, when answered together, will provide a comprehensive
understanding of the topic.

Each sub-question should:
- Be specific and searchable
- Cover a distinct aspect of the topic
- Together provide complete coverage

{format_instructions}`,
  ],
  ["human", "Research topic: {topic}"],
]);

/**
 * Planner Agent: breaks a broad topic into focused sub-questions.
 */
export async function planResearch(topic: string): Promise<SubQuestion[]> {
  const chain = RunnableSequence.from([
    prompt,
    createLLM(0.2),
    parser,
  ]);

  const result = await chain.invoke({
    topic,
    format_instructions: parser.getFormatInstructions(),
  });

  return result.sub_questions;
}
