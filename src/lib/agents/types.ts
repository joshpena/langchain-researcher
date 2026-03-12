/**
 * Shared types for the multi-agent research pipeline.
 *
 * Pipeline flow:
 *   User Input → Planner → Researcher (parallel) → Critic → Writer → Notifier
 *   Runs once per selected LLM provider (in parallel when multiple are chosen).
 */

export interface LLMProviderConfig {
  id: string;
  label: string;
  provider: "openai" | "anthropic";
  modelName: string;
}

export interface SubQuestion {
  id: number;
  question: string;
}

export interface ResearchResult {
  question: string;
  answer: string;
  sources: Source[];
}

export interface Source {
  title: string;
  url: string;
  snippet: string;
}

export interface CriticFeedback {
  passed: boolean;
  gaps: string[];
  suggestions: string[];
}

export interface ResearchReport {
  title: string;
  markdown: string;
  sources: Source[];
}

/** Events streamed to the frontend */
export type AgentEvent =
  | { type: "status"; agent: string; message: string; providerId: string }
  | { type: "sub_questions"; questions: SubQuestion[]; providerId: string }
  | { type: "research_result"; result: ResearchResult; providerId: string }
  | { type: "critic_feedback"; feedback: CriticFeedback; providerId: string }
  | { type: "report"; report: ResearchReport; providerId: string }
  | { type: "email_sent"; to: string; providerId: string }
  | { type: "error"; message: string; providerId: string }
  | { type: "done"; providerId: string }
  | { type: "all_done" };
