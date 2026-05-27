'use client';

import { useState, useEffect, useCallback } from 'react';

export function usePersistedTab<T extends string>(
  key: string,
  defaultTab: T,
  validTabs: readonly T[],
): [T, (tab: T) => void] {
  const [tab, setTabState] = useState<T>(defaultTab);

  useEffect(() => {
    const stored = sessionStorage.getItem(key);
    if (stored && validTabs.includes(stored as T)) {
      setTabState(stored as T);
    }
  // validTabs è un array const definito a livello di modulo — non cambia mai
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const setTab = useCallback(
    (newTab: T) => {
      sessionStorage.setItem(key, newTab);
      setTabState(newTab);
    },
    [key],
  );

  return [tab, setTab];
}
