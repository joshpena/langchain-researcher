import { type PipelineStage, STAGE_LABELS } from "./types";

interface PipelineProgressProps {
  stage: PipelineStage;
}

const STAGES: PipelineStage[] = ["planner", "researcher", "critic", "writer", "notifier"];

export function PipelineProgress({ stage }: PipelineProgressProps) {
  return (
    <div className="flex items-center gap-1 flex-wrap">
      {STAGES.map((s, i) => {
        const isActive = s === stage;
        const isPast = stage === "done" || STAGES.indexOf(stage) > i;
        const isFailed = stage === "error";

        return (
          <div key={s} className="flex items-center gap-1">
            {i > 0 && (
              <div
                className={`w-4 sm:w-8 h-0.5 shrink-0 ${isPast ? "bg-green-500" : "bg-gray-700"}`}
              />
            )}
            <div
              className={`px-2 sm:px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                isActive
                  ? isFailed
                    ? "bg-red-600 text-white"
                    : "bg-blue-600 text-white animate-pulse"
                  : isPast
                    ? "bg-green-600/20 text-green-400 border border-green-600"
                    : "bg-gray-800 text-gray-500 border border-gray-700"
              }`}
            >
              {STAGE_LABELS[s]}
            </div>
          </div>
        );
      })}
    </div>
  );
}
