import type { ResearchResult } from "@/lib/agents/types";

interface ResearchFindingsProps {
  results: ResearchResult[];
}

export function ResearchFindings({ results }: ResearchFindingsProps) {
  if (results.length === 0) return null;

  return (
    <div className="mb-6">
      <h3 className="text-base font-semibold mb-2">Research Findings</h3>
      <div className="space-y-3">
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
  );
}
