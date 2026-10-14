import {
  LayoutDashboard,
  Images,
  Settings,
  FolderOpen,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useState } from "react";

type NavigationItem = {
  label: string;
  icon: typeof LayoutDashboard;
  section: string;
};

interface SidebarProps {
  activeSection?: string;
  onNavigate?: (section: string) => void;
}

const navigationItems: NavigationItem[] = [
  {
    label: "Dashboard",
    icon: LayoutDashboard,
    section: "dashboard",
  },
  {
    label: "Asset Library",
    icon: Images,
    section: "assets",
  },
  {
    label: "Collections",
    icon: FolderOpen,
    section: "collections",
  },
  {
    label: "Settings",
    icon: Settings,
    section: "settings",
  },
];

export default function Sidebar({
  activeSection = "dashboard",
  onNavigate,
}: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={`flex min-h-screen flex-col border-r border-slate-200 bg-white transition-all duration-200 ${
        collapsed ? "w-20" : "w-64"
      }`}
    >
      <div className="flex h-16 items-center justify-between border-b border-slate-200 px-4">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600 text-white">
              <FolderOpen size={20} />
            </div>
            <span className="font-bold text-slate-900">DAM</span>
          </div>
        )}

        <button
          type="button"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          onClick={() => setCollapsed((value) => !value)}
          className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>

      <nav className="flex-1 space-y-1 p-3" aria-label="Main navigation">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeSection === item.section;

          return (
            <button
              key={item.section}
              type="button"
              title={collapsed ? item.label : undefined}
              aria-current={isActive ? "page" : undefined}
              onClick={() => onNavigate?.(item.section)}
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-indigo-50 text-indigo-700"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              } ${collapsed ? "justify-center" : ""}`}
            >
              <Icon size={19} className="shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </button>
          );
        })}
      </nav>

      <div className="border-t border-slate-200 p-4">
        {!collapsed && (
          <p className="text-xs text-slate-400">Digital Asset Management</p>
        )}
      </div>
    </aside>
  );
}
