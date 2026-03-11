/**
 * Shared types for the multi-agent research pipeline.
 *
 * Pipeline flow:
 *   User Input → Planner → Researcher (parallel) → Critic → Writer → Notifier
 */

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
  | { type: "status"; agent: string; message: string }
  | { type: "sub_questions"; questions: SubQuestion[] }
  | { type: "research_result"; result: ResearchResult }
  | { type: "critic_feedback"; feedback: CriticFeedback }
  | { type: "report"; report: ResearchReport }
  | { type: "email_sent"; to: string }
  | { type: "error"; message: string }
  | { type: "done" };
