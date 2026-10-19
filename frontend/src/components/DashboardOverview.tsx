import { Image, Video, HardDrive, Files, Plus } from "lucide-react";

type DashboardStats = {
  totalAssets: number;
  imageCount: number;
  videoCount: number;
  totalStorageBytes: string;
};

type DashboardOverviewProps = {
  stats: DashboardStats | null;
  loading: boolean;
  error: string;
  onRefresh: () => void;
  onExploreAssets: () => void;
};

function formatStorage(bytes: string): string {
  const value = Number(bytes);

  if (!Number.isFinite(value) || value < 0) return "0 B";
  if (value < 1024) return `${value} B`;

  const units = ["KB", "MB", "GB", "TB"];
  let size = value / 1024;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  return `${size.toFixed(2)} ${units[unitIndex]}`;
}

export default function DashboardOverview({
  stats,
  loading,
  error,
  onRefresh,
  onExploreAssets,
}: DashboardOverviewProps) {
  const cards = [
    {
      title: "Total Assets",
      value: stats?.totalAssets.toLocaleString() ?? "—",
      icon: Files,
      color: "bg-indigo-50 text-indigo-600",
      description: "Assets in your library",
    },
    {
      title: "Images",
      value: stats?.imageCount.toLocaleString() ?? "—",
      icon: Image,
      color: "bg-sky-50 text-sky-600",
      description: "Image files",
    },
    {
      title: "Videos",
      value: stats?.videoCount.toLocaleString() ?? "—",
      icon: Video,
      color: "bg-violet-50 text-violet-600",
      description: "Video files",
    },
    {
      title: "Storage Used",
      value: stats ? formatStorage(stats.totalStorageBytes) : "—",
      icon: HardDrive,
      color: "bg-emerald-50 text-emerald-600",
      description: "Total original file size",
    },
  ];

  return (
    <>
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-bold">Welcome to your workspace</h3>
          <p className="mt-1 text-sm text-slate-500">
            Here's an overview of your digital assets.
          </p>
        </div>

        <button
          type="button"
          onClick={onExploreAssets}
          className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white hover:bg-indigo-700"
        >
          <Plus size={18} />
          Explore assets
        </button>
      </div>

      {error && (
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <span>Unable to load statistics: {error}</span>
          <button
            type="button"
            onClick={onRefresh}
            className="font-semibold underline"
          >
            Try again
          </button>
        </div>
      )}

      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => {
          const Icon = card.icon;

          return (
            <div
              key={card.title}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-500">
                    {card.title}
                  </p>
                  <p className="mt-3 wrap-break-word text-3xl font-bold tracking-tight">
                    {loading && !stats ? "..." : card.value}
                  </p>
                </div>

                <div className={`shrink-0 rounded-xl p-3 ${card.color}`}>
                  <Icon size={22} />
                </div>
              </div>

              <p className="mt-4 text-xs text-slate-500">{card.description}</p>
            </div>
          );
        })}
      </div>

      <p className="mt-8 text-center text-xs text-slate-400">
        AssetFlow · Digital Asset Management
      </p>
    </>
  );
}
