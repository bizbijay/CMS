import { useCallback, useEffect, useState } from "react";
import { getStoredUser, getToken, userColumnPreferencesApi } from "../services/api";

export function useUserColumnPreferences<T extends Record<string, boolean>>(
  tableKey: string,
  defaultPreferences: T
) {
  const user = getStoredUser();
  const userIdKey = user?.id ? `user_${user.id}` : user?.username ? `user_${user.username}` : "guest";
  const storageKey = `cms.column_prefs.${userIdKey}.${tableKey}`;

  // Local storage cache loader
  const loadCachedPreferences = useCallback((): T => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const parsed = JSON.parse(stored) as Record<string, boolean>;
        return {
          ...defaultPreferences,
          ...parsed,
        };
      }
    } catch {
      /* ignore */
    }
    return defaultPreferences;
  }, [storageKey, defaultPreferences]);

  const [visibleColumns, setVisibleColumns] = useState<T>(loadCachedPreferences);
  const [isSyncedWithDb, setIsSyncedWithDb] = useState(false);

  // Sync from backend DB on mount
  useEffect(() => {
    let isMounted = true;
    const fetchFromDb = async () => {
      if (!getToken()) return;
      try {
        const dbPrefs = await userColumnPreferencesApi.get(tableKey);
        if (dbPrefs && Object.keys(dbPrefs).length > 0 && isMounted) {
          const merged = {
            ...defaultPreferences,
            ...dbPrefs,
          } as T;
          setVisibleColumns(merged);
          try {
            localStorage.setItem(storageKey, JSON.stringify(merged));
          } catch {
            /* ignore */
          }
          setIsSyncedWithDb(true);
        }
      } catch {
        // Degrade gracefully if backend DB is not reachable or unauthenticated
      }
    };

    fetchFromDb();
    return () => {
      isMounted = false;
    };
  }, [tableKey, storageKey, defaultPreferences]);

  // Helper to persist preferences to both state, local cache, and backend DB
  const savePreferences = useCallback(
    async (newPrefs: T) => {
      setVisibleColumns(newPrefs);
      // Cache locally instantly
      try {
        localStorage.setItem(storageKey, JSON.stringify(newPrefs));
      } catch {
        /* ignore */
      }

      // Sync to Database
      if (getToken()) {
        try {
          await userColumnPreferencesApi.save(tableKey, newPrefs);
          setIsSyncedWithDb(true);
        } catch {
          setIsSyncedWithDb(false);
        }
      }
    },
    [storageKey, tableKey]
  );

  const toggleColumn = useCallback(
    (key: string) => {
      const updated = {
        ...visibleColumns,
        [key]: !visibleColumns[key],
      };
      savePreferences(updated);
    },
    [visibleColumns, savePreferences]
  );

  const selectAll = useCallback(
    (allKeys: string[]) => {
      const updated = { ...visibleColumns };
      allKeys.forEach((key) => {
        (updated as Record<string, boolean>)[key] = true;
      });
      savePreferences(updated);
    },
    [visibleColumns, savePreferences]
  );

  const deselectAll = useCallback(
    (allKeys: string[], keepKey: string = "sn") => {
      const updated = { ...visibleColumns };
      allKeys.forEach((key) => {
        (updated as Record<string, boolean>)[key] = key === keepKey;
      });
      savePreferences(updated);
    },
    [visibleColumns, savePreferences]
  );

  const resetToDefault = useCallback(() => {
    savePreferences(defaultPreferences);
  }, [defaultPreferences, savePreferences]);

  // Check if current visibility differs from defaults
  const isCustomized = Object.keys(defaultPreferences).some(
    (k) => visibleColumns[k] !== defaultPreferences[k]
  );

  return {
    visibleColumns,
    setVisibleColumns: savePreferences,
    toggleColumn,
    selectAll,
    deselectAll,
    resetToDefault,
    isCustomized,
    isSyncedWithDb,
    userName: user?.firstName || user?.username || null,
  };
}
