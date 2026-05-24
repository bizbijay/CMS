import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { clearAuth, getStoredUser } from "../services/api";
import ChangePasswordModal from "./ChangePasswordModal";

export default function Header() {
  const navigate = useNavigate();
  const user = getStoredUser();
  const [changePwOpen, setChangePwOpen] = useState(false);

  function onLogout() {
    clearAuth();
    navigate("/login");
  }

  const initials =
    (user?.firstName?.[0] ?? user?.username?.[0] ?? "?").toUpperCase() +
    (user?.lastName?.[0] ?? "").toUpperCase();

  const fullName =
    user?.firstName || user?.lastName
      ? [user?.firstName, user?.lastName].filter(Boolean).join(" ")
      : user?.username ?? "";

  return (
    <header className="h-14 bg-white border-b border-slate-200 px-6 flex items-center justify-between">
      <div className="text-sm text-slate-500">Welcome back</div>

      {/* Avatar with hover-revealed dropdown */}
      <div className="relative group">
        <button
          type="button"
          aria-label="Account menu"
          className="w-9 h-9 rounded-full bg-blue-600 text-white text-sm font-semibold flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-blue-300"
        >
          {initials}
        </button>

        {/* Invisible hover bridge so moving from the avatar to the menu doesn't
            close the dropdown */}
        <div className="absolute right-0 top-full h-2 w-56 hidden group-hover:block" />

        <div
          className="absolute right-0 top-[calc(100%+0.5rem)] w-64 bg-white border border-slate-200 rounded-lg shadow-lg opacity-0 invisible translate-y-1 group-hover:opacity-100 group-hover:visible group-hover:translate-y-0 transition-all duration-150 z-40"
          role="menu"
        >
          <div className="px-4 py-3 border-b border-slate-100">
            <p className="text-sm font-medium text-slate-800 truncate">
              {fullName || "—"}
            </p>
            <p className="text-xs text-slate-500 truncate">{user?.email}</p>
          </div>
          <div className="p-2 space-y-0.5">
            <button
              onClick={() => setChangePwOpen(true)}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded text-slate-700 hover:bg-slate-100"
              role="menuitem"
            >
              <KeyIcon />
              Change password
            </button>
            <button
              onClick={onLogout}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded text-slate-700 hover:bg-slate-100"
              role="menuitem"
            >
              <SignOutIcon />
              Sign out
            </button>
          </div>
        </div>
      </div>

      <ChangePasswordModal
        open={changePwOpen}
        onClose={() => setChangePwOpen(false)}
      />
    </header>
  );
}

function KeyIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="w-4 h-4"
    >
      <path d="M21 2l-9.6 9.6" />
      <circle cx="7.5" cy="15.5" r="5.5" />
      <path d="M15.5 7.5l3 3" />
    </svg>
  );
}

function SignOutIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="w-4 h-4"
    >
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}
