import type { SubQuestion, ResearchResult, CriticFeedback, ResearchReport } from "@/lib/agents/types";

export type PipelineStage = "idle" | "planner" | "researcher" | "critic" | "writer" | "notifier" | "done" | "error";

export const STAGE_LABELS: Record<PipelineStage, string> = {
  idle: "Ready",
  planner: "Planning",
  researcher: "Researching",
  critic: "Reviewing",
  writer: "Writing",
  notifier: "Notifying",
  done: "Complete",
  error: "Error",
};

export interface ProviderState {
  stage: PipelineStage;
  statusMessages: string[];
  subQuestions: SubQuestion[];
  results: ResearchResult[];
  criticFeedback: CriticFeedback | null;
  report: ResearchReport | null;
  error: string | null;
}

export function emptyProviderState(): ProviderState {
  return {
    stage: "planner",
    statusMessages: [],
    subQuestions: [],
    results: [],
    criticFeedback: null,
    report: null,
    error: null,
  };
}
