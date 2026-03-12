import type { ProviderState } from "./types";
import { PipelineProgress } from "./PipelineProgress";
import { StatusLog } from "./StatusLog";
import { ResearchPlan } from "./ResearchPlan";
import { ResearchFindings } from "./ResearchFindings";
import { CriticFeedback } from "./CriticFeedback";
import { ResearchReport } from "./ResearchReport";
import { ErrorBanner } from "./ErrorBanner";

interface ProviderPipelineSectionProps {
  state: ProviderState;
  providerLabel: string;
  isMultiProvider: boolean;
}

export function ProviderPipelineSection({ state, providerLabel, isMultiProvider }: ProviderPipelineSectionProps) {
  const hasContent =
    state.statusMessages.length > 0 ||
    state.subQuestions.length > 0 ||
    state.results.length > 0 ||
    state.report;

  if (!hasContent) return null;

  return (
    <div className={isMultiProvider ? "mb-8 border border-gray-800 rounded-lg p-4" : ""}>
      {isMultiProvider && (
        <div className="mb-4">
          <h2 className="text-lg font-semibold mb-2">{providerLabel}</h2>
          <PipelineProgress stage={state.stage} />
        </div>
      )}

      {!isMultiProvider && state.stage !== "idle" && (
        <div className="mb-8">
          <PipelineProgress stage={state.stage} />
        </div>
      )}

      <StatusLog messages={state.statusMessages} />
      <ResearchPlan questions={state.subQuestions} />

      {!state.report && <ResearchFindings results={state.results} />}

      {state.criticFeedback && <CriticFeedback feedback={state.criticFeedback} />}

      {state.report && <ResearchReport report={state.report} collapsed={isMultiProvider} />}

      {state.error && <ErrorBanner message={state.error} />}
    </div>
  );
}
