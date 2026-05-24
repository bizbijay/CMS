import { useState } from "react";
import { NavLink } from "react-router-dom";

const menu = [
  { to: "/", label: "Dashboard", icon: DashboardIcon },
  { to: "/users", label: "Users", icon: UsersIcon },
];

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const width = collapsed ? "w-16" : "w-60";

  return (
    <aside
      className={`hidden md:flex md:flex-col ${width} bg-slate-900 text-slate-100 min-h-screen transition-all duration-200`}
    >
      <div
        className={`flex items-center border-b border-slate-800 ${collapsed ? "justify-center px-2" : "justify-between px-6"} py-4`}
      >
        {!collapsed && (
          <div>
            <h1 className="text-xl font-semibold tracking-wide">CMS</h1>
            <p className="text-xs text-slate-400">Admin console</p>
          </div>
        )}
        <button
          type="button"
          onClick={() => setCollapsed((c) => !c)}
          className="w-8 h-8 inline-flex items-center justify-center rounded text-slate-300 hover:text-white hover:bg-slate-800"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <ChevronIcon direction={collapsed ? "right" : "left"} />
        </button>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {menu.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/"}
            title={collapsed ? label : undefined}
            className={({ isActive }) =>
              [
                "flex items-center gap-3 rounded text-sm",
                collapsed ? "justify-center px-0 py-2" : "px-3 py-2",
                isActive
                  ? "bg-slate-800 text-white"
                  : "text-slate-300 hover:bg-slate-800 hover:text-white",
              ].join(" ")
            }
          >
            <Icon className="w-5 h-5 shrink-0" />
            {!collapsed && <span>{label}</span>}
          </NavLink>
        ))}
      </nav>

      {!collapsed && (
        <div className="px-6 py-4 border-t border-slate-800 text-xs text-slate-500">
          v0.1.0
        </div>
      )}
    </aside>
  );
}

function ChevronIcon({ direction }: { direction: "left" | "right" }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="w-4 h-4"
    >
      {direction === "left" ? (
        <polyline points="15 6 9 12 15 18" />
      ) : (
        <polyline points="9 6 15 12 9 18" />
      )}
    </svg>
  );
}

function DashboardIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <rect x="3" y="3" width="7" height="9" rx="1.5" />
      <rect x="14" y="3" width="7" height="5" rx="1.5" />
      <rect x="14" y="12" width="7" height="9" rx="1.5" />
      <rect x="3" y="16" width="7" height="5" rx="1.5" />
    </svg>
  );
}

function UsersIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}
