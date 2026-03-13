import { BaseCallbackHandler } from "@langchain/core/callbacks/base";
import type { LLMResult } from "@langchain/core/outputs";
import type { Serialized } from "@langchain/core/load/serializable";
import { estimateCost } from "./pricing";
import type { AgentStageMetrics, PipelineMetrics } from "./types";

interface StageData {
  promptTokens: number;
  completionTokens: number;
  llmCalls: number;
  llmLatencyMs: number;
  stageStartMs: number;
  stageEndMs: number;
  costUsd: number;
}

export class MetricsCollector {
  private currentAgent = "";
  private stages = new Map<string, StageData>();
  private pipelineStartMs = Date.now();

  markStageStart(agent: string): void {
    this.currentAgent = agent;
    const existing = this.stages.get(agent);
    if (!existing) {
      this.stages.set(agent, {
        promptTokens: 0,
        completionTokens: 0,
        llmCalls: 0,
        llmLatencyMs: 0,
        stageStartMs: Date.now(),
        stageEndMs: 0,
        costUsd: 0,
      });
    } else {
      // Critic loop: stage resumes, keep accumulated data
      existing.stageStartMs = existing.stageStartMs || Date.now();
    }
  }

  markStageEnd(agent: string): void {
    const data = this.stages.get(agent);
    if (data) {
      data.stageEndMs = Date.now();
    }
  }

  recordLLMUsage(promptTokens: number, completionTokens: number, latencyMs: number, modelName: string): void {
    const agent = this.currentAgent;
    const data = this.stages.get(agent);
    if (!data) return;

    data.promptTokens += promptTokens;
    data.completionTokens += completionTokens;
    data.llmCalls += 1;
    data.llmLatencyMs += latencyMs;
    data.costUsd += estimateCost(modelName, promptTokens, completionTokens);
  }

  getStageMetrics(agent: string): AgentStageMetrics | undefined {
    const data = this.stages.get(agent);
    if (!data) return undefined;

    return {
      agent,
      promptTokens: data.promptTokens,
      completionTokens: data.completionTokens,
      llmCalls: data.llmCalls,
      llmLatencyMs: data.llmLatencyMs,
      stageDurationMs: (data.stageEndMs || Date.now()) - data.stageStartMs,
      costUsd: data.costUsd,
    };
  }

  getSnapshot(): PipelineMetrics {
    const stages: AgentStageMetrics[] = [];
    let totalPromptTokens = 0;
    let totalCompletionTokens = 0;
    let totalCostUsd = 0;

    for (const [agent] of this.stages) {
      const metrics = this.getStageMetrics(agent)!;
      stages.push(metrics);
      totalPromptTokens += metrics.promptTokens;
      totalCompletionTokens += metrics.completionTokens;
      totalCostUsd += metrics.costUsd;
    }

    return {
      stages,
      totalPromptTokens,
      totalCompletionTokens,
      totalCostUsd,
      totalDurationMs: Date.now() - this.pipelineStartMs,
    };
  }
}

export class UsageCallbackHandler extends BaseCallbackHandler {
  name = "UsageCallbackHandler";

  private collector: MetricsCollector;
  private modelName: string;
  private startTimes = new Map<string, number>();

  constructor(collector: MetricsCollector, modelName: string) {
    super();
    this.collector = collector;
    this.modelName = modelName;
  }

  handleLLMStart(_llm: Serialized, _prompts: string[], runId: string): void {
    this.startTimes.set(runId, Date.now());
  }

  handleLLMEnd(output: LLMResult, runId: string): void {
    const startTime = this.startTimes.get(runId);
    const latencyMs = startTime ? Date.now() - startTime : 0;
    this.startTimes.delete(runId);

    let promptTokens = 0;
    let completionTokens = 0;

    const llmOutput = output.llmOutput;
    if (llmOutput) {
      // OpenAI format
      if (llmOutput.tokenUsage) {
        promptTokens = llmOutput.tokenUsage.promptTokens ?? 0;
        completionTokens = llmOutput.tokenUsage.completionTokens ?? 0;
      }
      // Anthropic format
      else if (llmOutput.usage) {
        promptTokens = llmOutput.usage.input_tokens ?? 0;
        completionTokens = llmOutput.usage.output_tokens ?? 0;
      }
    }

    this.collector.recordLLMUsage(promptTokens, completionTokens, latencyMs, this.modelName);
  }
}
