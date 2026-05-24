import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getStoredUser, usersApi } from "../services/api";

export default function Dashboard() {
  const user = getStoredUser();
  const [userCount, setUserCount] = useState<number | null>(null);

  useEffect(() => {
    usersApi
      .list()
      .then((rows) => setUserCount(rows.length))
      .catch(() => setUserCount(null));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-slate-800">Dashboard</h2>
        <p className="text-sm text-slate-500">
          Hello {user?.firstName || user?.username}, welcome to the CMS admin.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard
          label="Total users"
          value={userCount === null ? "—" : userCount.toString()}
          hint="All accounts in the system"
        />
        <StatCard label="Sessions today" value="—" hint="Coming soon" />
        <StatCard label="Pending tasks" value="—" hint="Coming soon" />
      </div>

      <div className="bg-white rounded-lg border border-slate-200 p-5">
        <h3 className="font-medium text-slate-800 mb-2">Quick actions</h3>
        <div className="flex flex-wrap gap-2">
          <Link
            to="/users"
            className="px-3 py-1.5 text-sm rounded bg-blue-600 hover:bg-blue-700 text-white"
          >
            Manage users
          </Link>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="bg-white rounded-lg border border-slate-200 p-5">
      <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
      <p className="text-3xl font-semibold text-slate-800 mt-1">{value}</p>
      {hint && <p className="text-xs text-slate-400 mt-1">{hint}</p>}
    </div>
  );
}
