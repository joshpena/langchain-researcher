"use client";

import { useState, useRef, useCallback } from "react";
import ReactMarkdown from "react-markdown";
import type { AgentEvent, SubQuestion, ResearchResult, CriticFeedback, ResearchReport } from "@/lib/agents/types";

type PipelineStage = "idle" | "planner" | "researcher" | "critic" | "writer" | "notifier" | "done" | "error";

const STAGE_LABELS: Record<PipelineStage, string> = {
  idle: "Ready",
  planner: "Planning",
  researcher: "Researching",
  critic: "Reviewing",
  writer: "Writing",
  notifier: "Notifying",
  done: "Complete",
  error: "Error",
};

export default function Home() {
  const [topic, setTopic] = useState("");
  const [stage, setStage] = useState<PipelineStage>("idle");
  const [statusMessages, setStatusMessages] = useState<string[]>([]);
  const [subQuestions, setSubQuestions] = useState<SubQuestion[]>([]);
  const [results, setResults] = useState<ResearchResult[]>([]);
  const [criticFeedback, setCriticFeedback] = useState<CriticFeedback | null>(null);
  const [report, setReport] = useState<ResearchReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const isRunning = stage !== "idle" && stage !== "done" && stage !== "error";

  const addStatus = useCallback((msg: string) => {
    setStatusMessages((prev) => [...prev, msg]);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim() || isRunning) return;

    // Reset state
    setStage("planner");
    setStatusMessages([]);
    setSubQuestions([]);
    setResults([]);
    setCriticFeedback(null);
    setReport(null);
    setError(null);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await fetch("/api/research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: topic.trim() }),
        signal: controller.signal,
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${await res.text()}`);
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error("No response stream");

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const event: AgentEvent = JSON.parse(line.slice(6));

          switch (event.type) {
            case "status":
              setStage(event.agent as PipelineStage);
              addStatus(`[${event.agent}] ${event.message}`);
              break;
            case "sub_questions":
              setSubQuestions(event.questions);
              break;
            case "research_result":
              setResults((prev) => [...prev, event.result]);
              break;
            case "critic_feedback":
              setCriticFeedback(event.feedback);
              break;
            case "report":
              setReport(event.report);
              break;
            case "email_sent":
              addStatus(`Email sent to ${event.to}`);
              break;
            case "error":
              setError(event.message);
              setStage("error");
              break;
            case "done":
              setStage("done");
              break;
          }
        }
      }
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        setError((err as Error).message);
        setStage("error");
      }
    }
  };

  const handleStop = () => {
    abortRef.current?.abort();
    setStage("idle");
    addStatus("Stopped by user");
  };

  return (
    <main className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-2">Research Assistant</h1>
      <p className="text-gray-400 mb-8">
        Enter a topic and the multi-agent pipeline will research, review, and write a report.
      </p>

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="flex gap-3 mb-8">
        <input
          type="text"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="e.g., The impact of AI on healthcare diagnostics"
          className="flex-1 bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-gray-100 placeholder-gray-500 focus:outline-none focus:border-blue-500"
          disabled={isRunning}
        />
        {isRunning ? (
          <button
            type="button"
            onClick={handleStop}
            className="px-6 py-3 bg-red-600 hover:bg-red-700 rounded-lg font-medium transition-colors"
          >
            Stop
          </button>
        ) : (
          <button
            type="submit"
            disabled={!topic.trim()}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:text-gray-500 rounded-lg font-medium transition-colors"
          >
            Research
          </button>
        )}
      </form>

      {/* Pipeline Progress */}
      {stage !== "idle" && (
        <div className="mb-8">
          <PipelineProgress stage={stage} />
        </div>
      )}

      {/* Status Log */}
      {statusMessages.length > 0 && (
        <div className="mb-8 bg-gray-900 border border-gray-800 rounded-lg p-4 max-h-48 overflow-y-auto">
          <h3 className="text-sm font-semibold text-gray-400 mb-2">Agent Activity</h3>
          {statusMessages.map((msg, i) => (
            <p key={i} className="text-sm text-gray-300 py-0.5 font-mono">
              {msg}
            </p>
          ))}
        </div>
      )}

      {/* Sub-Questions */}
      {subQuestions.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-3">Research Plan</h2>
          <ol className="list-decimal list-inside space-y-1 text-gray-300">
            {subQuestions.map((q) => (
              <li key={q.id}>{q.question}</li>
            ))}
          </ol>
        </div>
      )}

      {/* Research Results */}
      {results.length > 0 && !report && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-3">Research Findings</h2>
          <div className="space-y-4">
            {results.map((r, i) => (
              <details key={i} className="bg-gray-900 border border-gray-800 rounded-lg">
                <summary className="px-4 py-3 cursor-pointer font-medium text-gray-200 hover:text-white">
                  {r.question}
                </summary>
                <div className="px-4 pb-4 text-gray-300 text-sm">
                  <p className="whitespace-pre-wrap">{r.answer}</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {r.sources.map((s, j) => (
                      <a
                        key={j}
                        href={s.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-400 hover:underline"
                      >
                        [{j + 1}] {s.title}
                      </a>
                    ))}
                  </div>
                </div>
              </details>
            ))}
          </div>
        </div>
      )}

      {/* Critic Feedback */}
      {criticFeedback && !criticFeedback.passed && (
        <div className="mb-8 bg-yellow-900/20 border border-yellow-800 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-yellow-400 mb-2">Critic Feedback</h3>
          <ul className="text-sm text-yellow-200 list-disc list-inside">
            {criticFeedback.gaps.map((g, i) => (
              <li key={i}>{g}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Final Report */}
      {report && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-3">Final Report</h2>
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 prose prose-invert prose-sm max-w-none">
            <ReactMarkdown>{report.markdown}</ReactMarkdown>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mb-8 bg-red-900/20 border border-red-800 rounded-lg p-4">
          <p className="text-red-400">{error}</p>
        </div>
      )}
    </main>
  );
}

function PipelineProgress({ stage }: { stage: PipelineStage }) {
  const stages: PipelineStage[] = ["planner", "researcher", "critic", "writer", "notifier"];

  return (
    <div className="flex items-center gap-1">
      {stages.map((s, i) => {
        const isActive = s === stage;
        const isPast =
          stage === "done" || stages.indexOf(stage) > i;
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
