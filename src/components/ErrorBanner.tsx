interface ErrorBannerProps {
  message: string;
}

export function ErrorBanner({ message }: ErrorBannerProps) {
  return (
    <div className="mb-6 bg-red-900/20 border border-red-800 rounded-lg p-4">
      <p className="text-red-400">{message}</p>
    </div>
  );
}
