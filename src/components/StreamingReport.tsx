import ReactMarkdown from "react-markdown";

interface StreamingReportProps {
  markdown: string;
}

export function StreamingReport({ markdown }: StreamingReportProps) {
  return (
    <div className="mb-6">
      <h2 className="text-lg font-semibold mb-3">Writing Report...</h2>
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 prose prose-invert prose-sm max-w-none">
        <ReactMarkdown>{markdown}</ReactMarkdown>
        <span className="inline-block w-2 h-4 bg-blue-400 animate-pulse ml-0.5" />
      </div>
    </div>
  );
}
