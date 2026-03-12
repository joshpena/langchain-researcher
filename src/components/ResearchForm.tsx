interface ResearchFormProps {
  topic: string;
  onTopicChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onStop: () => void;
  isRunning: boolean;
  canSubmit: boolean;
}

export function ResearchForm({ topic, onTopicChange, onSubmit, onStop, isRunning, canSubmit }: ResearchFormProps) {
  return (
    <form onSubmit={onSubmit} className="flex gap-3 mb-8">
      <input
        type="text"
        value={topic}
        onChange={(e) => onTopicChange(e.target.value)}
        placeholder="e.g., The impact of AI on healthcare diagnostics"
        className="flex-1 bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-gray-100 placeholder-gray-500 focus:outline-none focus:border-blue-500"
        disabled={isRunning}
      />
      {isRunning ? (
        <button
          type="button"
          onClick={onStop}
          className="px-6 py-3 bg-red-600 hover:bg-red-700 rounded-lg font-medium transition-colors"
        >
          Stop
        </button>
      ) : (
        <button
          type="submit"
          disabled={!canSubmit}
          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:text-gray-500 rounded-lg font-medium transition-colors"
        >
          Research
        </button>
      )}
    </form>
  );
}
