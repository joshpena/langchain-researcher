import type { SubQuestion } from "@/lib/agents/types";

interface ResearchPlanProps {
  questions: SubQuestion[];
}

export function ResearchPlan({ questions }: ResearchPlanProps) {
  if (questions.length === 0) return null;

  return (
    <div className="mb-6">
      <h3 className="text-base font-semibold mb-2">Research Plan</h3>
      <ol className="list-decimal list-inside space-y-1 text-gray-300">
        {questions.map((q) => (
          <li key={q.id}>{q.question}</li>
        ))}
      </ol>
    </div>
  );
}
