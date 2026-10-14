import { AlertCircle, RefreshCw } from "lucide-react";

interface AssetErrorProps {
  message: string;
  onRetry?: () => void;
}

export default function AssetError({ message, onRetry }: AssetErrorProps) {
  return (
    <div
      role="alert"
      className="mt-5 flex flex-col items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-5 py-10 text-center"
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600">
        <AlertCircle size={24} />
      </div>

      <div>
        <h3 className="font-semibold text-red-800">Unable to load assets</h3>

        <p className="mt-1 max-w-lg text-sm text-red-700">{message}</p>
      </div>

      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2"
        >
          <RefreshCw size={15} />
          Try again
        </button>
      )}
    </div>
  );
}
