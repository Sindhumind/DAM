import { Database, FileImage, Film, HardDrive } from "lucide-react";

interface AssetStatsProps {
  totalAssets: number;
  imageCount: number;
  videoCount: number;
  totalStorageBytes: number;
}

function formatStorage(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) {
    return "Unknown";
  }

  if (bytes < 1024) {
    return `${bytes} B`;
  }

  const units = ["KB", "MB", "GB", "TB"];
  const unitIndex = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)) - 1,
    units.length - 1,
  );

  return `${(bytes / Math.pow(1024, unitIndex + 1)).toFixed(2)} ${units[unitIndex]}`;
}

export default function AssetStats({
  totalAssets,
  imageCount,
  videoCount,
  totalStorageBytes,
}: AssetStatsProps) {
  const stats = [
    {
      label: "Total assets",
      value: totalAssets.toLocaleString("en-IN"),
      icon: Database,
      color: "bg-indigo-50 text-indigo-600",
    },
    {
      label: "Images",
      value: imageCount.toLocaleString("en-IN"),
      icon: FileImage,
      color: "bg-blue-50 text-blue-600",
    },
    {
      label: "Videos",
      value: videoCount.toLocaleString("en-IN"),
      icon: Film,
      color: "bg-purple-50 text-purple-600",
    },
    {
      label: "Storage used",
      value: formatStorage(totalStorageBytes),
      icon: HardDrive,
      color: "bg-emerald-50 text-emerald-600",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {stats.map((stat) => {
        const Icon = stat.icon;

        return (
          <div
            key={stat.label}
            className="rounded-xl border border-slate-200 bg-white p-5"
          >
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-medium text-slate-500">{stat.label}</p>

              <div
                className={`flex h-10 w-10 items-center justify-center rounded-lg ${stat.color}`}
              >
                <Icon size={20} />
              </div>
            </div>

            <p className="mt-4 text-2xl font-bold text-slate-900">
              {stat.value}
            </p>
          </div>
        );
      })}
    </div>
  );
}
