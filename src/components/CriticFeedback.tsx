import type { CriticFeedback as CriticFeedbackType } from "@/lib/agents/types";

interface CriticFeedbackProps {
  feedback: CriticFeedbackType;
}

export function CriticFeedback({ feedback }: CriticFeedbackProps) {
  if (feedback.passed) return null;

  return (
    <div className="mb-6 bg-yellow-900/20 border border-yellow-800 rounded-lg p-4">
      <h3 className="text-sm font-semibold text-yellow-400 mb-2">Critic Feedback</h3>
      <ul className="text-sm text-yellow-200 list-disc list-inside">
        {feedback.gaps.map((g, i) => (
          <li key={i}>{g}</li>
        ))}
      </ul>
    </div>
  );
}
