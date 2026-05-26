import { useRef } from 'react';

export function useTabSwipe<T extends string>(
  tab: T,
  setTab: (tab: T) => void,
  tabs: readonly T[],
) {
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);

  function handleTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  }

  function handleTouchEnd(e: React.TouchEvent) {
    if (touchStartX.current === null || touchStartY.current === null) return;
    const deltaX = e.changedTouches[0].clientX - touchStartX.current;
    const deltaY = e.changedTouches[0].clientY - touchStartY.current;
    touchStartX.current = null;
    touchStartY.current = null;
    if (Math.abs(deltaX) < 50 || Math.abs(deltaX) < Math.abs(deltaY)) return;
    const i = tabs.indexOf(tab);
    if (deltaX < 0 && i < tabs.length - 1) setTab(tabs[i + 1]);
    if (deltaX > 0 && i > 0) setTab(tabs[i - 1]);
  }

  return { handleTouchStart, handleTouchEnd };
}
