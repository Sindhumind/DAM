import { useCallback, useEffect, useState } from "react";
import DashboardOverview from "./components/DashboardOverview";
import Sidebar from "./components/layout/Sidebar";
import Header from "./components/layout/Header";
import AssetLibrary from "./components/AssetLibrary";
import Login from "./components/Login";
import useAppSession from "./hooks/useAppSession";
import useDashboardStats from "./hooks/useDashboardStats";

type Page = "dashboard" | "assets";

function getPageFromHash(): Page {
  return window.location.hash === "#assets" ? "assets" : "dashboard";
}

export default function App() {
  const {
    stats,
    loading,
    error: statsError,
    loadStats,
    setUnauthorizedHandler,
  } = useDashboardStats();

  const onAuthenticated = useCallback(() => {
    void loadStats();
  }, [loadStats]);

  const {
    user,
    checkingSession,
    error: sessionError,
    setError: setSessionError,
    handleLogout,
    handleLoginSuccess,
  } = useAppSession(onAuthenticated);

  const [page, setPage] = useState<Page>(getPageFromHash);
  const error = statsError || sessionError;

  useEffect(() => {
    setUnauthorizedHandler(() => {
      void handleLogout();
    });
  }, [setUnauthorizedHandler, handleLogout]);

  const navigateTo = useCallback((nextPage: Page) => {
    if (window.location.hash !== `#${nextPage}`) {
      window.location.hash = nextPage;
    }
    setPage(nextPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const retryStats = useCallback(() => {
    setSessionError("");
    void loadStats();
  }, [loadStats, setSessionError]);

  useEffect(() => {
    const handleHashChange = () => {
      setPage(getPageFromHash());
      window.scrollTo({ top: 0, behavior: "smooth" });
    };

    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  if (checkingSession) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <p className="text-sm text-slate-500">Verifying your session...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50">
        {error && (
          <div
            role="alert"
            className="mx-auto mt-4 max-w-md rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"
          >
            {error}
          </div>
        )}
        <Login onLoginSuccess={handleLoginSuccess} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      <div className="flex min-h-screen">
        <div className="hidden shrink-0 lg:block">
          <Sidebar
            activeSection={page}
            onNavigate={(section) => {
              if (section === "dashboard" || section === "assets") {
                navigateTo(section);
              }
            }}
          />
        </div>

        <main className="min-w-0 flex-1">
          <Header
            title={page === "dashboard" ? "Dashboard" : "Asset Library"}
            subtitle={
              page === "dashboard"
                ? "Welcome to your digital asset workspace"
                : "Browse and manage your digital assets"
            }
            userEmail={user.email}
            userRole={user.role}
            onLogout={handleLogout}
          />

          <div className="p-4 sm:p-6">
            {error && (
              <div
                role="alert"
                className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700"
              >
                <span>{error}</span>
                <button
                  type="button"
                  onClick={retryStats}
                  className="rounded-md border border-red-300 px-3 py-1.5 font-medium hover:bg-red-100"
                >
                  Retry
                </button>
              </div>
            )}

            {page === "dashboard" && (
              <DashboardOverview
                stats={stats}
                loading={loading}
                error={error}
                onRefresh={retryStats}
                onExploreAssets={() => navigateTo("assets")}
              />
            )}

            {page === "assets" && <AssetLibrary />}
          </div>
        </main>
      </div>
    </div>
  );
}