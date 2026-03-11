import { ChatPromptTemplate } from "@langchain/core/prompts";
import { RunnableSequence } from "@langchain/core/runnables";
import { createLLM } from "./llm";
import type { ResearchReport, ResearchResult, Source } from "./types";

const prompt = ChatPromptTemplate.fromMessages([
  [
    "system",
    `You are an expert research writer. Synthesize the provided research into a
well-structured markdown report. The report should:

1. Have a clear, descriptive title
2. Start with an executive summary (2-3 sentences)
3. Organize findings into logical sections with headers
4. Include specific facts, data, and quotes from the research
5. End with a "Key Takeaways" section
6. Be professional but readable

Use markdown formatting: headers (##, ###), bold, bullet points, etc.
Do NOT include a sources/references section — that will be added automatically.`,
  ],
  [
    "human",
    `Topic: {topic}

Research Findings:
{findings}

Write the report:`,
  ],
]);

/**
 * Writer Agent: synthesizes all research into a structured markdown report.
 */
export async function writeReport(
  topic: string,
  results: ResearchResult[]
): Promise<ResearchReport> {
  const findings = results
    .map(
      (r) => `### ${r.question}\n\n${r.answer}`
    )
    .join("\n\n---\n\n");

  const chain = RunnableSequence.from([prompt, createLLM(0.3)]);

  const response = await chain.invoke({ topic, findings });
  const markdown = response.content as string;

  // Extract title from the first heading
  const titleMatch = markdown.match(/^#\s+(.+)$/m);
  const title = titleMatch ? titleMatch[1] : topic;

  // Collect all unique sources
  const allSources: Source[] = [];
  const seen = new Set<string>();
  for (const r of results) {
    for (const s of r.sources) {
      if (!seen.has(s.url)) {
        seen.add(s.url);
        allSources.push(s);
      }
    }
  }

  // Append sources section
  const sourcesSection =
    "\n\n---\n\n## Sources\n\n" +
    allSources.map((s, i) => `${i + 1}. [${s.title}](${s.url})`).join("\n");

  return {
    title,
    markdown: markdown + sourcesSection,
    sources: allSources,
  };
}
