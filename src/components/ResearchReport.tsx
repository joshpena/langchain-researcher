import ReactMarkdown from "react-markdown";
import type { ResearchReport as ResearchReportType } from "@/lib/agents/types";

interface ResearchReportProps {
  report: ResearchReportType;
  collapsed: boolean;
}

export function ResearchReport({ report, collapsed }: ResearchReportProps) {
  if (collapsed) {
    return (
      <div className="mb-6">
        <details className="bg-gray-900 border border-gray-800 rounded-lg">
          <summary className="px-6 py-4 cursor-pointer text-lg font-semibold text-gray-200 hover:text-white">
            {report.title}
          </summary>
          <div className="px-6 pb-6 prose prose-invert prose-sm max-w-none">
            <ReactMarkdown>{report.markdown}</ReactMarkdown>
          </div>
        </details>
      </div>
    );
  }

  return (
    <div className="mb-6">
      <h2 className="text-lg font-semibold mb-3">Final Report</h2>
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 prose prose-invert prose-sm max-w-none">
        <ReactMarkdown>{report.markdown}</ReactMarkdown>
      </div>
    </div>
  );
}
