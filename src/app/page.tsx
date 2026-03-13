"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import type { AgentEvent, LLMProviderConfig } from "@/lib/agents/types";
import { type PipelineStage, type ProviderState, emptyProviderState } from "@/components/types";
import { ProviderSelector } from "@/components/ProviderSelector";
import { ResearchForm } from "@/components/ResearchForm";
import { ProviderPipelineSection } from "@/components/ProviderPipelineSection";

export default function Home() {
  const [topic, setTopic] = useState("");
  const [email, setEmail] = useState("");
  const [providers, setProviders] = useState<LLMProviderConfig[]>([]);
  const [selectedProviders, setSelectedProviders] = useState<string[]>([]);
  const [globalStage, setGlobalStage] = useState<"idle" | "running" | "done" | "error">("idle");
  const [providerStates, setProviderStates] = useState<Record<string, ProviderState>>({});
  const abortRef = useRef<AbortController | null>(null);

  const isRunning = globalStage === "running";

  // Fetch available providers on mount
  useEffect(() => {
    fetch("/api/providers")
      .then((res) => res.json())
      .then((data: LLMProviderConfig[]) => {
        setProviders(data);
        if (data.length > 0) setSelectedProviders([data[0].id]);
      })
      .catch(() => {});
  }, []);

  const toggleProvider = (id: string) => {
    setSelectedProviders((prev) => {
      if (prev.includes(id)) {
        if (prev.length <= 1) return prev;
        return prev.filter((p) => p !== id);
      }
      return [...prev, id];
    });
  };

  const updateProviderState = useCallback(
    (providerId: string, updater: (prev: ProviderState) => Partial<ProviderState>) => {
      setProviderStates((prev) => {
        const current = prev[providerId] || emptyProviderState();
        return { ...prev, [providerId]: { ...current, ...updater(current) } };
      });
    },
    []
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim() || isRunning || selectedProviders.length === 0) return;

    setGlobalStage("running");
    const initialStates: Record<string, ProviderState> = {};
    for (const id of selectedProviders) {
      initialStates[id] = emptyProviderState();
    }
    setProviderStates(initialStates);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await fetch("/api/research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: topic.trim(), providerIds: selectedProviders, email: email.trim() || undefined }),
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

          if (event.type === "all_done") {
            setGlobalStage("done");
            continue;
          }

          const pid = event.providerId;

          switch (event.type) {
            case "status":
              updateProviderState(pid, (s) => ({
                stage: event.agent as PipelineStage,
                statusMessages: [...s.statusMessages, `[${event.agent}] ${event.message}`],
              }));
              break;
            case "sub_questions":
              updateProviderState(pid, () => ({ subQuestions: event.questions }));
              break;
            case "research_result":
              updateProviderState(pid, (s) => ({ results: [...s.results, event.result] }));
              break;
            case "critic_feedback":
              updateProviderState(pid, () => ({ criticFeedback: event.feedback }));
              break;
            case "report_chunk":
              updateProviderState(pid, (s) => ({
                streamingMarkdown: (s.streamingMarkdown ?? "") + event.chunk,
              }));
              break;
            case "report":
              updateProviderState(pid, () => ({ report: event.report, streamingMarkdown: null }));
              break;
            case "email_sent":
              updateProviderState(pid, (s) => ({
                statusMessages: [...s.statusMessages, `Email sent to ${event.to}`],
              }));
              break;
            case "error":
              updateProviderState(pid, (s) => ({
                error: event.message,
                stage: "error" as PipelineStage,
                statusMessages: [...s.statusMessages, `[error] ${event.message}`],
              }));
              break;
            case "done":
              updateProviderState(pid, () => ({ stage: "done" as PipelineStage }));
              break;
          }
        }
      }
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        setGlobalStage("error");
      }
    }
  };

  const handleStop = () => {
    abortRef.current?.abort();
    setGlobalStage("idle");
  };

  const providerLabel = (id: string) => providers.find((p) => p.id === id)?.label ?? id;
  const isMultiProvider = selectedProviders.length > 1;

  return (
    <main className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-2">Research Assistant</h1>
      <p className="text-gray-400 mb-8">
        Enter a topic and the multi-agent pipeline will research, review, and write a report.
      </p>

      <ProviderSelector
        providers={providers}
        selectedProviders={selectedProviders}
        onToggle={toggleProvider}
        disabled={isRunning}
      />

      <ResearchForm
        topic={topic}
        onTopicChange={setTopic}
        email={email}
        onEmailChange={setEmail}
        onSubmit={handleSubmit}
        onStop={handleStop}
        isRunning={isRunning}
        canSubmit={!!topic.trim() && selectedProviders.length > 0}
      />

      {Object.keys(providerStates).map((pid) => (
        <ProviderPipelineSection
          key={pid}
          state={providerStates[pid]}
          providerLabel={providerLabel(pid)}
          isMultiProvider={isMultiProvider}
        />
      ))}
    </main>
  );
}
