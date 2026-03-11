import { planResearch } from "./planner";
import { researchQuestion } from "./researcher";
import { critiqueResearch } from "./critic";
import { writeReport } from "./writer";
import { sendReportEmail } from "./notifier";
import type { AgentEvent, ResearchResult } from "./types";

const MAX_CRITIC_LOOPS = 2;

/**
 * Orchestrates the full research pipeline, yielding events for streaming.
 *
 * Flow:
 *   Planner → Researcher (parallel) → Critic → (loop?) → Writer → Notifier
 */
export async function* runResearchPipeline(
  topic: string
): AsyncGenerator<AgentEvent> {
  try {
    // --- Step 1: Planner ---
    yield { type: "status", agent: "planner", message: "Breaking down the topic into sub-questions..." };

    const subQuestions = await planResearch(topic);
    yield { type: "sub_questions", questions: subQuestions };
    yield {
      type: "status",
      agent: "planner",
      message: `Created ${subQuestions.length} sub-questions`,
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
      };

      // Research questions in parallel
      const newResults = await Promise.all(
        questionsToResearch.map(async (question) => {
          const result = await researchQuestion(question);
          return result;
        })
      );

      // Stream each result as it completes
      for (const result of newResults) {
        allResults.push(result);
        yield { type: "research_result", result };
      }

      // --- Step 3: Critic ---
      yield {
        type: "status",
        agent: "critic",
        message: "Evaluating research quality and completeness...",
      };

      const feedback = await critiqueResearch(topic, allResults);
      yield { type: "critic_feedback", feedback };

      if (feedback.passed || criticLoop >= MAX_CRITIC_LOOPS) {
        if (!feedback.passed) {
          yield {
            type: "status",
            agent: "critic",
            message: "Max revision rounds reached. Proceeding with available research.",
          };
        } else {
          yield {
            type: "status",
            agent: "critic",
            message: "Research quality approved!",
          };
        }
        break;
      }

      // Critic wants more research — loop back
      yield {
        type: "status",
        agent: "critic",
        message: `Found gaps. Researching ${feedback.suggestions.length} additional question(s)...`,
      };
      questionsToResearch = feedback.suggestions;
      criticLoop++;
    }

    // --- Step 4: Writer ---
    yield {
      type: "status",
      agent: "writer",
      message: "Synthesizing findings into a structured report...",
    };

    const report = await writeReport(topic, allResults);
    yield { type: "report", report };

    // --- Step 5: Notifier ---
    yield {
      type: "status",
      agent: "notifier",
      message: "Sending email notification...",
    };

    const emailResult = await sendReportEmail(report);
    if (emailResult.sent) {
      yield { type: "email_sent", to: emailResult.to! };
    } else {
      yield {
        type: "status",
        agent: "notifier",
        message: emailResult.error || "Email not sent",
      };
    }

    yield { type: "done" };
  } catch (err) {
    yield {
      type: "error",
      message: err instanceof Error ? err.message : "Unknown error in pipeline",
    };
  }
}
