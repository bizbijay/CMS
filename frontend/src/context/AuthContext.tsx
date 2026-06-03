import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { authApi, getToken } from "../services/api";
import { POLICY_MAP } from "../lib/policies";

interface AuthContextValue {
  permissions: Set<string>;
  permissionsLoaded: boolean;
  loading: boolean;
  can: (policy: string) => boolean;
  refreshPermissions: () => Promise<void>;
  clearPermissions: () => void;
}

const AuthContext = createContext<AuthContextValue>({
  permissions: new Set(),
  permissionsLoaded: false,
  loading: false,
  can: () => true,
  refreshPermissions: async () => {},
  clearPermissions: () => {},
});

const PERMS_KEY = "cms.permissions";

function loadCached(): Set<string> | null {
  try {
    const raw = sessionStorage.getItem(PERMS_KEY);
    return raw ? new Set(JSON.parse(raw) as string[]) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const cached = loadCached();
  const [permissions, setPermissions] = useState<Set<string>>(cached ?? new Set());
  const [permissionsLoaded, setPermissionsLoaded] = useState(cached !== null);
  const [loading, setLoading] = useState(false);

  const clearPermissions = useCallback(() => {
    setPermissions(new Set());
    setPermissionsLoaded(false);
    sessionStorage.removeItem(PERMS_KEY);
  }, []);

  const refreshPermissions = useCallback(async () => {
    if (!getToken()) {
      clearPermissions();
      return;
    }
    setLoading(true);
    try {
      const names = await authApi.myPermissions();
      const perms = new Set(names);
      setPermissions(perms);
      setPermissionsLoaded(true);
      sessionStorage.setItem(PERMS_KEY, JSON.stringify(names));
    } catch {
      // Endpoint may not exist yet — degrade gracefully (backend still enforces)
      setPermissionsLoaded(false);
    } finally {
      setLoading(false);
    }
  }, [clearPermissions]);

  // Clear permissions when the API session expires
  useEffect(() => {
    const handle = () => clearPermissions();
    window.addEventListener("cms:unauthorized", handle);
    return () => window.removeEventListener("cms:unauthorized", handle);
  }, [clearPermissions]);

  // Auto-load on mount when a token is present but cache is empty
  useEffect(() => {
    if (getToken() && !permissionsLoaded && !loading) {
      refreshPermissions();
    }
    // intentionally run once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const can = useCallback(
    (policy: string): boolean => {
      // While not yet loaded, allow everything — backend is the authoritative guard
      if (!permissionsLoaded) return true;
      const permissionName = POLICY_MAP[policy] ?? policy;
      return permissions.has(permissionName);
    },
    [permissions, permissionsLoaded],
  );

  return (
    <AuthContext.Provider
      value={{ permissions, permissionsLoaded, loading, can, refreshPermissions, clearPermissions }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
