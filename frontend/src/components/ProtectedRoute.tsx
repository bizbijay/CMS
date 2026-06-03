import { Navigate } from "react-router-dom";
import { getToken } from "../services/api";
import { useAuth } from "../context/AuthContext";

interface Props {
  children: JSX.Element;
  /** When provided, also checks this policy. Redirects to /unauthorized if denied. */
  policy?: string;
}

export default function ProtectedRoute({ children, policy }: Props) {
  const token = getToken();
  const { can, permissionsLoaded } = useAuth();

  if (!token) return <Navigate to="/login" replace />;

  // Only enforce the policy once permissions have been resolved from the backend.
  // Before that, we allow through (graceful degradation — backend still enforces).
  if (policy && permissionsLoaded && !can(policy)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
}
