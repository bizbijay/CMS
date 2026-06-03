import { usePolicy } from "../hooks/usePolicy";

interface Props {
  do: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * Renders children only when the current user has the specified policy.
 * While permissions are loading, children are shown (graceful degradation).
 *
 * Usage:
 *   <Can do="users.create">
 *     <button>Add user</button>
 *   </Can>
 *
 *   <Can do="users.delete" fallback={<span>No access</span>}>
 *     <button>Delete</button>
 *   </Can>
 */
export default function Can({ do: policy, children, fallback = null }: Props) {
  const allowed = usePolicy(policy);
  return <>{allowed ? children : fallback}</>;
}
