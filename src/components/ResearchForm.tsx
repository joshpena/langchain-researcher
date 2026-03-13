interface ResearchFormProps {
  topic: string;
  onTopicChange: (value: string) => void;
  email: string;
  onEmailChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onStop: () => void;
  isRunning: boolean;
  canSubmit: boolean;
}

export function ResearchForm({ topic, onTopicChange, email, onEmailChange, onSubmit, onStop, isRunning, canSubmit }: ResearchFormProps) {
  return (
    <form onSubmit={onSubmit} className="mb-8 space-y-3">
      <input
        type="text"
        value={topic}
        onChange={(e) => onTopicChange(e.target.value)}
        placeholder="e.g., The impact of AI on healthcare diagnostics"
        className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-gray-100 placeholder-gray-500 focus:outline-none focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        disabled={isRunning}
        autoFocus
      />
      <div className="flex gap-3">
        <input
          type="email"
          value={email}
          onChange={(e) => onEmailChange(e.target.value)}
          placeholder="Email for report delivery (optional)"
          className="flex-1 bg-gray-900 border border-gray-700 rounded-lg px-4 py-2.5 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={isRunning}
        />
        {isRunning ? (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onStop();
            }}
            className="px-6 py-2.5 bg-red-600 hover:bg-red-700 rounded-lg font-medium transition-colors"
          >
            Stop
          </button>
        ) : (
          <button
            type="submit"
            disabled={!canSubmit}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:text-gray-500 rounded-lg font-medium transition-colors"
          >
            Research
          </button>
        )}
      </div>
    </form>
  );
}
