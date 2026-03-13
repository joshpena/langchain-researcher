import { planResearch } from "./planner";
import { researchQuestion } from "./researcher";
import { critiqueResearch } from "./critic";
import { streamWriteReport } from "./writer";
import { sendReportEmail } from "./notifier";
import { getProviderLabel } from "./llm";
import type { AgentEvent, ResearchResult, ResearchReport } from "./types";

const MAX_CRITIC_LOOPS = 2;

/**
 * Runs the full research pipeline for a single LLM provider.
 */
async function* runSinglePipeline(
  topic: string,
  providerId: string
): AsyncGenerator<AgentEvent> {
  try {
    // --- Step 1: Planner ---
    yield { type: "status", agent: "planner", message: "Breaking down the topic into sub-questions...", providerId };

    const subQuestions = await planResearch(topic, providerId);
    yield { type: "sub_questions", questions: subQuestions, providerId };
    yield {
      type: "status",
      agent: "planner",
      message: `Created ${subQuestions.length} sub-questions`,
      providerId,
    };

    // --- Step 2: Researcher (with critic loop) ---
    let allResults: ResearchResult[] = [];
    let questionsToResearch = subQuestions.map((q) => q.question);
    let criticLoop = 0;

    while (criticLoop <= MAX_CRITIC_LOOPS) {
      yield {
        type: "status",
        agent: "researcher",
        message: `Researching ${questionsToResearch.length} question(s)${criticLoop > 0 ? ` (revision ${criticLoop})` : ""}...`,
        providerId,
      };

      // Research questions in parallel
      const newResults = await Promise.all(
        questionsToResearch.map(async (question) => {
          const result = await researchQuestion(question, providerId);
          return result;
        })
      );

      // Stream each result as it completes
      for (const result of newResults) {
        allResults.push(result);
        yield { type: "research_result", result, providerId };
      }

      // --- Step 3: Critic ---
      yield {
        type: "status",
        agent: "critic",
        message: "Evaluating research quality and completeness...",
        providerId,
      };

      const feedback = await critiqueResearch(topic, allResults, providerId);
      yield { type: "critic_feedback", feedback, providerId };

      if (feedback.passed || criticLoop >= MAX_CRITIC_LOOPS) {
        if (!feedback.passed) {
          yield {
            type: "status",
            agent: "critic",
            message: "Max revision rounds reached. Proceeding with available research.",
            providerId,
          };
        } else {
          yield {
            type: "status",
            agent: "critic",
            message: "Research quality approved!",
            providerId,
          };
        }
        break;
      }

      // Critic wants more research — loop back
      yield {
        type: "status",
        agent: "critic",
        message: `Found gaps. Researching ${feedback.suggestions.length} additional question(s)...`,
        providerId,
      };
      questionsToResearch = feedback.suggestions;
      criticLoop++;
    }

    // --- Step 4: Writer ---
    yield {
      type: "status",
      agent: "writer",
      message: "Synthesizing findings into a structured report...",
      providerId,
    };

    let report: ResearchReport | null = null;
    for await (const event of streamWriteReport(topic, allResults, providerId)) {
      if ("chunk" in event) {
        yield { type: "report_chunk" as const, chunk: event.chunk, providerId };
      } else {
        report = event.complete;
      }
    }
    if (report) {
      yield { type: "report" as const, report, providerId };
    }
    yield { type: "done", providerId };

    return report;
  } catch (err) {
    yield {
      type: "error",
      message: err instanceof Error ? err.message : "Unknown error in pipeline",
      providerId,
    };
    return null;
  }
}

/**
 * Merges multiple async generators into a single stream, interleaving events.
 */
async function* mergeGenerators<T>(generators: AsyncGenerator<T, unknown>[]): AsyncGenerator<T> {
  const iterators = generators.map((gen, index) => ({
    gen,
    promise: gen.next().then((val) => ({ val, index })),
    done: false,
  }));

  while (iterators.some((it) => !it.done)) {
    const active = iterators.filter((it) => !it.done);
    const { val, index } = await Promise.race(active.map((it) => it.promise));

    if (val.done) {
      iterators[index].done = true;
    } else {
      yield val.value;
      iterators[index].promise = iterators[index].gen.next().then((v) => ({ val: v, index }));
    }
  }
}

/**
 * Orchestrates the full research pipeline, yielding events for streaming.
 * Runs one pipeline per selected provider, merging events when multiple are chosen.
 * If an email address is provided, sends one email per completed report.
 */
export async function* runResearchPipeline(
  topic: string,
  providerIds: string[],
  email?: string
): AsyncGenerator<AgentEvent> {
  const reports: { providerId: string; report: ResearchReport }[] = [];

  if (providerIds.length === 1) {
    for await (const event of runSinglePipeline(topic, providerIds[0])) {
      yield event;
      if (event.type === "report") reports.push({ providerId: providerIds[0], report: event.report });
    }
  } else {
    const pipelines = providerIds.map((id) => runSinglePipeline(topic, id));
    for await (const event of mergeGenerators(pipelines)) {
      yield event;
      if (event.type === "report") reports.push({ providerId: event.providerId, report: event.report });
    }
  }

  // Send one email per report if the user provided an email address
  if (email && reports.length > 0) {
    for (const { providerId, report } of reports) {
      yield { type: "status", agent: "notifier", message: "Sending email notification...", providerId };
      const emailResult = await sendReportEmail(report, email, getProviderLabel(providerId));
      if (emailResult.sent) {
        yield { type: "email_sent", to: emailResult.to!, providerId };
      } else {
        yield { type: "status", agent: "notifier", message: emailResult.error || "Email not sent", providerId };
      }
    }
  }

  yield { type: "all_done" };
}
