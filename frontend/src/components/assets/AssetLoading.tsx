import { LoaderCircle } from "lucide-react";

interface AssetLoadingProps {
  message?: string;
}

export default function AssetLoading({
  message = "Loading assets...",
}: AssetLoadingProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex min-h-64 flex-col items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white p-8"
    >
      <LoaderCircle size={32} className="animate-spin text-indigo-600" />

      <p className="text-sm font-medium text-slate-600">{message}</p>

      <span className="sr-only">Please wait.</span>
    </div>
  );
}
