import { useEffect, useState } from "react";
import {
  Image,
  Video,
  HardDrive,
  Files,
  Search,
  Bell,
  Plus,
  LayoutDashboard,
  FolderOpen,
  Settings,
  RefreshCw,
} from "lucide-react";

import AssetLibrary from "./components/AssetLibrary";

type DashboardStats = {
  totalAssets: number;
  imageCount: number;
  videoCount: number;
  totalStorageBytes: string;
};

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

function formatStorage(bytes: string) {
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

function App() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadStats = async () => {
    setLoading(true);

    try {
      setError("");

      const response = await fetch(`${API_BASE_URL}/api/assets/stats`);

      if (!response.ok) {
        throw new Error(`Request failed: ${response.status}`);
      }

      const data: DashboardStats = await response.json();
      setStats(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load dashboard statistics.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;

    const fetchStats = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/assets/stats`);

        if (!response.ok) {
          throw new Error(`Request failed: ${response.status}`);
        }

        const data: DashboardStats = await response.json();

        if (!cancelled) {
          setStats(data);
          setError("");
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Unable to load dashboard statistics.",
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void fetchStats();

    return () => {
      cancelled = true;
    };
  }, []);

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
    <div className="min-h-screen bg-slate-50 text-slate-800">
      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-slate-200 bg-white p-6 lg:block">
        <div className="mb-10 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white">
            <Files size={22} />
          </div>

          <div>
            <h1 className="text-lg font-bold">AssetFlow</h1>
            <p className="text-xs text-slate-500">Digital Asset Manager</p>
          </div>
        </div>

        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
          Workspace
        </p>

        <nav className="space-y-2">
          <a
            href="#dashboard"
            className="flex items-center gap-3 rounded-xl bg-indigo-50 px-4 py-3 font-medium text-indigo-700"
          >
            <LayoutDashboard size={19} />
            Dashboard
          </a>

          <a
            href="#assets"
            className="flex items-center gap-3 rounded-xl px-4 py-3 text-slate-600 hover:bg-slate-50"
          >
            <FolderOpen size={19} />
            Asset Library
          </a>
        </nav>

        <div className="absolute bottom-6 left-6 right-6">
          <a
            href="#settings"
            className="flex items-center gap-3 rounded-xl px-4 py-3 text-slate-600 hover:bg-slate-50"
          >
            <Settings size={19} />
            Settings
          </a>

          <div className="mt-4 rounded-xl bg-slate-50 p-4">
            <p className="text-sm font-semibold">Storage overview</p>
            <p className="mt-1 text-xs text-slate-500">
              {stats ? formatStorage(stats.totalStorageBytes) : "Loading..."}{" "}
              used
            </p>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="lg:ml-64">
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 bg-white px-6 py-5 md:px-10">
          <div>
            <p className="text-sm text-slate-500">Workspace / Overview</p>
            <h2 className="mt-1 text-2xl font-bold">Dashboard</h2>
          </div>

          <div className="flex items-center gap-3">
            <a
              href="#assets"
              className="hidden items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-500 hover:bg-slate-50 sm:flex"
            >
              <Search size={17} />
              <span>Search assets</span>
            </a>

            <button
              type="button"
              aria-label="Notifications"
              className="rounded-xl border border-slate-200 p-2.5 hover:bg-slate-50"
            >
              <Bell size={19} />
            </button>

            <button
              type="button"
              onClick={() => void loadStats()}
              disabled={loading}
              className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
            >
              <RefreshCw size={16} />
              Refresh
            </button>
          </div>
        </header>

        <div id="dashboard" className="p-6 md:p-10">
          {/* Welcome */}
          <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h3 className="text-xl font-bold">Welcome to your workspace</h3>
              <p className="mt-1 text-sm text-slate-500">
                Here's an overview of your digital assets.
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                document.getElementById("assets")?.scrollIntoView({
                  behavior: "smooth",
                })
              }
              className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white hover:bg-indigo-700"
            >
              <Plus size={18} />
              Explore assets
            </button>
          </div>

          {/* Error message */}
          {error && (
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              <span>Unable to load statistics: {error}</span>

              <button
                type="button"
                onClick={() => void loadStats()}
                className="font-semibold underline"
              >
                Try again
              </button>
            </div>
          )}

          {/* Statistics cards */}
          <div className="mb-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
            {cards.map((card) => {
              const Icon = card.icon;

              return (
                <div
                  key={card.title}
                  className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-500">
                        {card.title}
                      </p>
                      <p className="mt-3 text-3xl font-bold tracking-tight">
                        {loading && !stats ? "..." : card.value}
                      </p>
                    </div>

                    <div className={`rounded-xl p-3 ${card.color}`}>
                      <Icon size={22} />
                    </div>
                  </div>

                  <p className="mt-4 text-xs text-slate-500">
                    {card.description}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Connected Asset Library */}
          <section id="assets" className="scroll-mt-6">
            <AssetLibrary />
          </section>

          <p className="mt-8 text-center text-xs text-slate-400">
            AssetFlow · Digital Asset Management
          </p>
        </div>
      </main>
    </div>
  );
}

export default App;
