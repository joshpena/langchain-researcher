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
    `Topic: The history of the printing press

Research Findings:
### When was it invented?
Johannes Gutenberg developed movable-type printing around 1440 in Mainz, Germany, after years of experimentation with metal alloys and oil-based inks.

### What was its cultural impact?
It enabled mass production of books, slashing costs and accelerating the spread of the Renaissance, the Protestant Reformation, and the Scientific Revolution.

Write the report:`,
  ],
  [
    "ai",
    `# The Printing Press: A Revolution in Communication

Johannes Gutenberg's movable-type press, developed around 1440, fundamentally transformed how knowledge was produced and distributed across Europe. By making books affordable and abundant, it catalyzed some of history's most consequential intellectual and religious movements.

## Origins

Gutenberg developed his press in **Mainz, Germany**, after years of experimentation with durable metal type and oil-based inks suited for high-volume printing. His **Gutenberg Bible** (c. 1455) was among the first major books produced with the new technology.

## Cultural Impact

- **The Renaissance** spread faster as scholars could share texts across borders at unprecedented speed
- **The Protestant Reformation** was fueled by the rapid distribution of pamphlets and Luther's translated Bible
- **The Scientific Revolution** accelerated as researchers could publish and replicate findings widely

## Key Takeaways

- Movable-type printing was invented by Gutenberg around 1440 in Germany
- It dramatically reduced the cost and time required to produce books
- The press is widely considered one of the most consequential inventions in human history`,
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
  results: ResearchResult[],
  providerId: string
): Promise<ResearchReport> {
  const findings = results
    .map(
      (r) => `### ${r.question}\n\n${r.answer}`
    )
    .join("\n\n---\n\n");

  const chain = RunnableSequence.from([prompt, createLLM(providerId, 0.3)]);

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
