export interface ModelPricing {
  promptCostPer1M: number;
  completionCostPer1M: number;
}

export const MODEL_PRICING: Record<string, ModelPricing> = {
  "gpt-4o-mini":              { promptCostPer1M: 0.15,  completionCostPer1M: 0.60 },
  "gpt-4o":                   { promptCostPer1M: 2.50,  completionCostPer1M: 10.00 },
  "claude-sonnet-4-20250514": { promptCostPer1M: 3.00,  completionCostPer1M: 15.00 },
};

export function estimateCost(modelName: string, promptTokens: number, completionTokens: number): number {
  const pricing = MODEL_PRICING[modelName];
  if (!pricing) return 0;
  return (promptTokens / 1_000_000) * pricing.promptCostPer1M
       + (completionTokens / 1_000_000) * pricing.completionCostPer1M;
}
