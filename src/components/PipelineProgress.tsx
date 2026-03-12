import { type PipelineStage, STAGE_LABELS } from "./types";

interface PipelineProgressProps {
  stage: PipelineStage;
}

const STAGES: PipelineStage[] = ["planner", "researcher", "critic", "writer", "notifier"];

export function PipelineProgress({ stage }: PipelineProgressProps) {
  return (
    <div className="flex items-center gap-1">
      {STAGES.map((s, i) => {
        const isActive = s === stage;
        const isPast = stage === "done" || STAGES.indexOf(stage) > i;
        const isFailed = stage === "error";

        return (
          <div key={s} className="flex items-center gap-1">
            {i > 0 && (
              <div
                className={`w-8 h-0.5 ${isPast ? "bg-green-500" : "bg-gray-700"}`}
              />
            )}
            <div
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
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
