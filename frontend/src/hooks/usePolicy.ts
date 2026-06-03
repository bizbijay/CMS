import { useAuth } from "../context/AuthContext";

export function usePolicy(policy: string): boolean {
  return useAuth().can(policy);
}
