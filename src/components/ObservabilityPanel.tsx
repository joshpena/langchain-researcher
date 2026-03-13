"use client";

import { useState } from "react";
import type { AgentStageMetrics, PipelineMetrics } from "@/lib/agents/types";

interface ObservabilityPanelProps {
  stageMetrics: AgentStageMetrics[];
  pipelineMetrics: PipelineMetrics | null;
}

const AGENT_COLORS: Record<string, string> = {
  planner: "bg-purple-500",
  researcher: "bg-blue-500",
  critic: "bg-yellow-500",
  writer: "bg-green-500",
  notifier: "bg-gray-500",
};

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

function formatCost(usd: number): string {
  if (usd === 0) return "$0";
  if (usd < 0.01) return `$${usd.toFixed(4)}`;
  return `$${usd.toFixed(2)}`;
}

function formatTokens(n: number): string {
  if (n === 0) return "—";
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return n.toString();
}

export function ObservabilityPanel({ stageMetrics, pipelineMetrics }: ObservabilityPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (stageMetrics.length === 0) return null;

  const totalCost = pipelineMetrics?.totalCostUsd ?? stageMetrics.reduce((sum, m) => sum + m.costUsd, 0);
  const totalDuration = pipelineMetrics?.totalDurationMs ?? stageMetrics.reduce((sum, m) => sum + m.stageDurationMs, 0);
  const maxDuration = Math.max(...stageMetrics.map((m) => m.stageDurationMs), 1);

  return (
    <div className="mb-4 border border-gray-700 rounded-lg overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-4 py-2.5 bg-gray-800/50 hover:bg-gray-800 transition-colors text-sm"
      >
        <span className="font-medium text-gray-300">Pipeline Metrics</span>
        <span className="flex items-center gap-3 text-gray-400">
          <span>{formatDuration(totalDuration)}</span>
          <span>{formatCost(totalCost)}</span>
          <span className="text-xs">{isExpanded ? "▲" : "▼"}</span>
        </span>
      </button>

      {isExpanded && (
        <div className="p-4 space-y-4 bg-gray-900/50">
          {/* Timing Bars */}
          <div>
            <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">Timing</h3>
            <div className="space-y-1.5">
              {stageMetrics.map((m) => (
                <div key={m.agent} className="flex items-center gap-2">
                  <span className="text-xs text-gray-400 w-20 text-right capitalize">{m.agent}</span>
                  <div className="flex-1 h-5 bg-gray-800 rounded overflow-hidden">
                    <div
                      className={`h-full ${AGENT_COLORS[m.agent] ?? "bg-gray-500"} rounded flex items-center px-2 min-w-[2rem]`}
                      style={{ width: `${Math.max((m.stageDurationMs / maxDuration) * 100, 5)}%` }}
                    >
                      <span className="text-[10px] font-medium text-white whitespace-nowrap">
                        {formatDuration(m.stageDurationMs)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Token Usage Table */}
          <div>
            <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">Token Usage</h3>
            <table className="w-full text-xs">
              <thead>
                <tr className="text-gray-500">
                  <th className="text-left py-1 font-medium">Agent</th>
                  <th className="text-right py-1 font-medium">Prompt</th>
                  <th className="text-right py-1 font-medium">Completion</th>
                  <th className="text-right py-1 font-medium">Calls</th>
                  <th className="text-right py-1 font-medium">Cost</th>
                </tr>
              </thead>
              <tbody>
                {stageMetrics
                  .filter((m) => m.llmCalls > 0)
                  .map((m) => (
                    <tr key={m.agent} className="text-gray-300 border-t border-gray-800">
                      <td className="py-1.5 capitalize">{m.agent}</td>
                      <td className="text-right py-1.5 tabular-nums">{formatTokens(m.promptTokens)}</td>
                      <td className="text-right py-1.5 tabular-nums">{formatTokens(m.completionTokens)}</td>
                      <td className="text-right py-1.5 tabular-nums">{m.llmCalls}</td>
                      <td className="text-right py-1.5 tabular-nums">{formatCost(m.costUsd)}</td>
                    </tr>
                  ))}
              </tbody>
              {pipelineMetrics && (
                <tfoot>
                  <tr className="text-gray-200 border-t border-gray-600 font-medium">
                    <td className="py-1.5">Total</td>
                    <td className="text-right py-1.5 tabular-nums">{formatTokens(pipelineMetrics.totalPromptTokens)}</td>
                    <td className="text-right py-1.5 tabular-nums">{formatTokens(pipelineMetrics.totalCompletionTokens)}</td>
                    <td className="text-right py-1.5"></td>
                    <td className="text-right py-1.5 tabular-nums">{formatCost(pipelineMetrics.totalCostUsd)}</td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
