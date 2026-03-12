import { ChatPromptTemplate } from "@langchain/core/prompts";
import { RunnableSequence } from "@langchain/core/runnables";
import { TavilySearch } from "@langchain/tavily";
import { createLLM } from "./llm";
import type { ResearchResult, Source } from "./types";

const synthesizePrompt = ChatPromptTemplate.fromMessages([
  [
    "system",
    `You are a research analyst. Given a question and search results, write a
clear, factual answer based on the sources provided. Include specific data,
dates, and facts. If the sources conflict, note the disagreement.

Keep your answer concise but thorough (2-4 paragraphs).`,
  ],
  [
    "human",
    `Question: {question}

Search Results:
{search_results}

Write a well-sourced answer:`,
  ],
]);

/**
 * Researcher Agent: searches the web for a sub-question and synthesizes results.
 * Multiple instances run in parallel for different sub-questions.
 */
export async function researchQuestion(
  question: string,
  providerId: string
): Promise<ResearchResult> {
  // Step 1: Search the web using Tavily
  const searchTool = new TavilySearch({
    maxResults: 5,
  });

  const { results: searchResults } = await searchTool.invoke({ query: question }) as {
    results: Array<{ title: string; url: string; content: string }>;
  };

  // Step 2: Extract sources
  const sources: Source[] = searchResults.map((r) => ({
    title: r.title || "Untitled",
    url: r.url,
    snippet: r.content?.slice(0, 200) || "",
  }));

  // Step 3: Synthesize an answer from the search results
  const formattedResults = searchResults
    .map(
      (r, i) =>
        `[${i + 1}] ${r.title}\nURL: ${r.url}\n${r.content}\n`
    )
    .join("\n---\n");

  const chain = RunnableSequence.from([synthesizePrompt, createLLM(providerId, 0.1)]);

  const response = await chain.invoke({
    question,
    search_results: formattedResults,
  });

  return {
    question,
    answer: response.content as string,
    sources,
  };
}

/**
 * Research multiple questions in parallel.
 */
export async function researchAllQuestions(
  questions: string[],
  providerId: string
): Promise<ResearchResult[]> {
  return Promise.all(questions.map((q) => researchQuestion(q, providerId)));
}
