import { CheckCircle2, Clock3, LoaderCircle, AlertCircle } from "lucide-react";

interface AssetStatusBadgeProps {
  status: string;
}

export default function AssetStatusBadge({ status }: AssetStatusBadgeProps) {
  const normalizedStatus = status?.toLowerCase() ?? "";

  let label = status || "Unknown";
  let styles = "bg-slate-100 text-slate-600";
  let Icon = Clock3;

  if (
    ["completed", "processed", "ready", "success", "uploaded"].includes(
      normalizedStatus,
    )
  ) {
    label = "Ready";
    styles = "bg-emerald-50 text-emerald-700";
    Icon = CheckCircle2;
  } else if (["pending", "queued", "processing"].includes(normalizedStatus)) {
    label = normalizedStatus === "processing" ? "Processing" : "Pending";
    styles = "bg-amber-50 text-amber-700";
    Icon = LoaderCircle;
  } else if (["failed", "error", "rejected"].includes(normalizedStatus)) {
    label = "Failed";
    styles = "bg-red-50 text-red-700";
    Icon = AlertCircle;
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${styles}`}
    >
      <Icon
        size={13}
        aria-hidden="true"
        className={normalizedStatus === "processing" ? "animate-spin" : ""}
      />
      {label}
    </span>
  );
}
