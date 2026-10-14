import { Bell, Search } from "lucide-react";
import Input from "../common/Input";

interface HeaderProps {
  title?: string;
  subtitle?: string;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
}

export default function Header({
  title = "Digital Asset Management",
  subtitle = "Manage your digital assets in one place",
  searchValue,
  onSearchChange,
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

        <div className="flex items-center gap-3">
          {onSearchChange && (
            <div className="relative w-full sm:w-64">
              <Search
                size={17}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <Input
                type="search"
                aria-label="Search"
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
            className="relative rounded-lg border border-slate-200 p-2.5 text-slate-600 transition hover:bg-slate-50"
          >
            <Bell size={19} />
          </button>
        </div>
      </div>
    </header>
  );
}
