import { useNavigate } from "react-router-dom";

export default function Unauthorized() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="bg-white border border-slate-200 rounded-lg shadow-sm w-full max-w-md p-8 text-center space-y-5">
        <div className="flex justify-center">
          <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center">
            <LockIcon />
          </div>
        </div>

        <div className="space-y-1">
          <h1 className="text-2xl font-semibold text-slate-800">Unauthorised</h1>
          <p className="text-sm text-slate-500">
            Your session has expired or you do not have permission to access
            this resource. Please log in again.
          </p>
        </div>

        <button
          onClick={() => navigate("/login", { replace: true })}
          className="w-full px-4 py-2 rounded bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium"
        >
          Go to login
        </button>
      </div>
    </div>
  );
}

function LockIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="w-7 h-7 text-red-500"
    >
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}
