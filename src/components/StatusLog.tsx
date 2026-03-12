interface StatusLogProps {
  messages: string[];
}

export function StatusLog({ messages }: StatusLogProps) {
  if (messages.length === 0) return null;

  return (
    <div className="mb-6 bg-gray-900 border border-gray-800 rounded-lg p-4 max-h-48 overflow-y-auto">
      <h3 className="text-sm font-semibold text-gray-400 mb-2">Agent Activity</h3>
      {messages.map((msg, i) => (
        <p key={i} className="text-sm text-gray-300 py-0.5 font-mono">
          {msg}
        </p>
      ))}
    </div>
  );
}
