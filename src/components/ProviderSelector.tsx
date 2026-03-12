import type { LLMProviderConfig } from "@/lib/agents/types";

interface ProviderSelectorProps {
  providers: LLMProviderConfig[];
  selectedProviders: string[];
  onToggle: (id: string) => void;
  disabled: boolean;
}

export function ProviderSelector({ providers, selectedProviders, onToggle, disabled }: ProviderSelectorProps) {
  if (providers.length === 0) return null;

  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-400 mb-2">LLM Providers</label>
      <div className="flex flex-wrap gap-2">
        {providers.map((p) => {
          const selected = selectedProviders.includes(p.id);
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => onToggle(p.id)}
              disabled={disabled}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                selected
                  ? "bg-blue-600 text-white"
                  : "bg-gray-800 text-gray-400 border border-gray-700 hover:border-gray-500"
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {p.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
