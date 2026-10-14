import { useEffect, useState } from "react";
import {
  Image,
  Video,
  HardDrive,
  Files,
  Plus,
  LayoutDashboard,
  FolderOpen,
  RefreshCw,
} from "lucide-react";

import AssetLibrary from "./components/AssetLibrary";

type DashboardStats = {
  totalAssets: number;
  imageCount: number;
  videoCount: number;
  totalStorageBytes: string;
};

type Page = "dashboard" | "assets";

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

function getPageFromHash(): Page {
  return window.location.hash === "#assets" ? "assets" : "dashboard";
}

function App() {
  const [page, setPage] = useState<Page>(getPageFromHash);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const navigateTo = (nextPage: Page) => {
    if (window.location.hash !== `#${nextPage}`) {
      window.location.hash = nextPage;
    }

    setPage(nextPage);
    window.scrollTo({ top: 0, behavior: "auto" });
  };

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
    const handleHashChange = () => {
      setPage(getPageFromHash());
      window.scrollTo({ top: 0, behavior: "auto" });
    };

    window.addEventListener("hashchange", handleHashChange);

    return () => {
      window.removeEventListener("hashchange", handleHashChange);
    };
  }, []);

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

  const navClass = (target: Page) =>
    `flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left font-medium transition-colors ${
      page === target
        ? "bg-indigo-50 text-indigo-700"
        : "text-slate-600 hover:bg-slate-50"
    }`;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-64 border-r border-slate-200 bg-white p-6 lg:block">
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
          <button
            type="button"
            onClick={() => navigateTo("dashboard")}
            aria-current={page === "dashboard" ? "page" : undefined}
            className={navClass("dashboard")}
          >
            <LayoutDashboard size={19} />
            Dashboard
          </button>

          <button
            type="button"
            onClick={() => navigateTo("assets")}
            aria-current={page === "assets" ? "page" : undefined}
            className={navClass("assets")}
          >
            <FolderOpen size={19} />
            Assets
          </button>
        </nav>
      </aside>

      {/* Main content */}
      <main className="lg:ml-64">
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 bg-white px-6 py-5 md:px-10">
          <h2 className="text-2xl font-bold">
            {page === "dashboard" ? "Dashboard" : "Asset Library"}
          </h2>

          {page === "dashboard" && (
            <button
              type="button"
              onClick={() => void loadStats()}
              disabled={loading}
              className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
            >
              <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
              Refresh
            </button>
          )}
        </header>
        <div className="p-6 md:p-10">
          {page === "dashboard" && (
            <>
              <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h3 className="text-xl font-bold">
                    Welcome to your workspace
                  </h3>

                  <p className="mt-1 text-sm text-slate-500">
                    Here's an overview of your digital assets.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => navigateTo("assets")}
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
                    onClick={() => void loadStats()}
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

                        <div
                          className={`shrink-0 rounded-xl p-3 ${card.color}`}
                        >
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

              <p className="mt-8 text-center text-xs text-slate-400">
                AssetFlow · Digital Asset Management
              </p>
            </>
          )}

          {page === "assets" && <AssetLibrary />}
        </div>
      </main>
    </div>
  );
}

export default App;