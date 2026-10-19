import { Bell, Search, LogOut } from "lucide-react";
import Input from "../common/Input";

interface HeaderProps {
  title?: string;
  subtitle?: string;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  userEmail?: string;
  userRole?: string;
  onLogout?: () => void | Promise<void>;
}

export default function Header({
  title = "Digital Asset Management",
  subtitle = "Manage your digital assets in one place",
  searchValue,
  onSearchChange,
  userEmail,
  userRole,
  onLogout,
}: HeaderProps) {
  return (
    <header className="border-b border-slate-200 bg-white px-4 py-4 sm:px-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">
            {title}
          </h1>
          <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {onSearchChange && (
            <div className="relative w-full sm:w-64">
              <Search
                size={17}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <Input
                type="search"
                aria-label="Search assets"
                placeholder="Search assets..."
                value={searchValue ?? ""}
                onChange={(event) => onSearchChange(event.target.value)}
                className="py-2 pl-9"
              />
            </div>
          )}

          <button
            type="button"
            aria-label="Notifications"
            className="rounded-lg border border-slate-200 p-2.5 text-slate-600 transition hover:bg-slate-50"
          >
            <Bell size={19} />
          </button>

          {userEmail && (
            <div className="hidden text-right sm:block">
              <p className="text-sm font-medium text-slate-800">{userEmail}</p>
              {userRole && (
                <p className="text-xs capitalize text-slate-500">{userRole}</p>
              )}
            </div>
          )}

          {onLogout && (
            <button
              type="button"
              onClick={() => void onLogout()}
              className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
            >
              <LogOut size={17} />
              <span>Logout</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
