'use client';

import { useState, useRef, useTransition, useEffect } from 'react';
import { useTabSwipe } from '@/hooks/use-tab-swipe';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Cat, Users, RefreshCw } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { search, fetchExploreGrid, type ExploreThumb, type UserResult, type SightingResult } from '../actions';

const DEBOUNCE_MS = 350;
const EXPLORE_SESSION_KEY = 'explore_order_v1';
const TABS = ['utenti', 'gatti'] as const;
type Tab = (typeof TABS)[number];

// ─── Griglia esplora ──────────────────────────────────────────────────────────

function ThumbSkeleton({ count }: { count: number }) {
  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-px">
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className="aspect-square rounded-none" />
      ))}
    </div>
  );
}

function ThumbGrid({ items }: { items: ExploreThumb[] }) {
  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7   animate-in fade-in duration-300">
      {items.map((item) => (
        <Link key={item.id} href={`/post/${item.id}`} className="aspect-square block overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={item.thumbnailUrl} alt={item.catNickname} className="w-full h-full object-cover" />
        </Link>
      ))}
    </div>
  );
}

// ─── Risultati utenti ─────────────────────────────────────────────────────────

function UserRow({ user }: { user: UserResult }) {
  return (
    <Link
      href={`/profilo/${user.username}`}
      className="flex items-center gap-3 px-4 py-3 active:bg-muted transition-colors"
    >
      <div className="w-11 h-11 rounded-full overflow-hidden bg-muted shrink-0">
        {user.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={user.avatarUrl} alt={user.nickname} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-primary/20 flex items-center justify-center">
            <span className="text-sm font-semibold text-primary uppercase">
              {user.username.slice(0, 2)}
            </span>
          </div>
        )}
      </div>
      <div className="flex flex-col min-w-0">
        <span className="text-sm font-semibold text-foreground truncate">{user.nickname}</span>
        <span className="text-xs text-muted-foreground">@{user.username}</span>
      </div>
      <div className="ml-auto flex items-center gap-1 text-xs text-muted-foreground shrink-0">
        <Cat className="w-3.5 h-3.5" />
        {user.catCount}
      </div>
    </Link>
  );
}

// ─── Risultati gatti ──────────────────────────────────────────────────────────

function SightingRow({ sighting }: { sighting: SightingResult }) {
  const dateFormatted = new Intl.DateTimeFormat('it-IT', { dateStyle: 'medium' }).format(
    new Date(sighting.createdAt),
  );
  return (
    <Link
      href={`/post/${sighting.id}`}
      className="flex items-center gap-3 px-4 py-3 active:bg-muted transition-colors"
    >
      <div className="w-11 h-11 rounded-lg overflow-hidden bg-muted shrink-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={sighting.thumbnailUrl} alt={sighting.catNickname} className="w-full h-full object-cover" />
      </div>
      <div className="flex flex-col min-w-0">
        <span className="text-sm font-semibold text-foreground truncate">{sighting.catNickname}</span>
        <span className="text-xs text-muted-foreground">@{sighting.username} · {dateFormatted}</span>
      </div>
    </Link>
  );
}

function EmptyTab({ message }: { message: string }) {
  return (
    <p className="text-center text-sm text-muted-foreground py-16">{message}</p>
  );
}

// ─── Componente principale ────────────────────────────────────────────────────

interface Props {
  exploreItems: ExploreThumb[];
}

export default function CercaClient({ exploreItems }: Props) {
  const searchParams = useSearchParams();
  const query = searchParams.get('q') ?? '';

  const [displayItems, setDisplayItems] = useState<ExploreThumb[] | null>(null);
  const [results, setResults] = useState<{ users: UserResult[]; sightings: SightingResult[] }>({
    users: [],
    sightings: [],
  });
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<Tab>('utenti');
  const [, startTransition] = useTransition();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { handleTouchStart, handleTouchEnd } = useTabSwipe(tab, setTab, TABS);

  // Pull-to-refresh
  const [pullProgress, setPullProgress] = useState(0); // 0–1+
  const [isRefreshing, setIsRefreshing] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const pullProgressRef = useRef(0);
  const isRefreshingRef = useRef(false);
  const hasVibratedRef = useRef(false);
  const PULL_THRESHOLD = 80;

  useEffect(() => {
    const el: HTMLDivElement = scrollRef.current!;
    if (!el) return;
    let startY: number | null = null;

    function onTouchStart(e: TouchEvent) {
      if (el.scrollTop > 0 || isRefreshingRef.current) return;
      startY = e.touches[0].clientY;
      hasVibratedRef.current = false;
    }

    function onTouchMove(e: TouchEvent) {
      if (startY === null) return;
      const deltaY = e.touches[0].clientY - startY;
      if (deltaY <= 0) { startY = null; pullProgressRef.current = 0; setPullProgress(0); return; }
      const progress = Math.min(deltaY / PULL_THRESHOLD, 1.4);
      pullProgressRef.current = progress;
      setPullProgress(progress);
      if (progress >= 1 && !hasVibratedRef.current) {
        hasVibratedRef.current = true;
        navigator.vibrate?.(40);
      }
      if (deltaY > 8) e.preventDefault();
    }

    function onTouchEnd() {
      if (startY === null) return;
      startY = null;
      if (pullProgressRef.current >= 1 && !isRefreshingRef.current) {
        isRefreshingRef.current = true;
        setIsRefreshing(true);
        setPullProgress(0);
        pullProgressRef.current = 0;
        sessionStorage.removeItem(EXPLORE_SESSION_KEY);
        setDisplayItems(null);
        fetchExploreGrid().then((items) => {
          sessionStorage.setItem(EXPLORE_SESSION_KEY, JSON.stringify(items.map((i) => i.id)));
          setDisplayItems(items);
          isRefreshingRef.current = false;
          setIsRefreshing(false);
        });
      } else {
        setPullProgress(0);
        pullProgressRef.current = 0;
      }
      hasVibratedRef.current = false;
    }

    el.addEventListener('touchstart', onTouchStart, { passive: true });
    el.addEventListener('touchmove', onTouchMove, { passive: false });
    el.addEventListener('touchend', onTouchEnd, { passive: true });
    el.addEventListener('touchcancel', onTouchEnd, { passive: true });
    return () => {
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchmove', onTouchMove);
      el.removeEventListener('touchend', onTouchEnd);
      el.removeEventListener('touchcancel', onTouchEnd);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Stabilizza l'ordine della griglia per tutta la sessione
  useEffect(() => {
    const saved = sessionStorage.getItem(EXPLORE_SESSION_KEY);
    if (saved) {
      const savedIds: string[] = JSON.parse(saved);
      const idToItem = new Map(exploreItems.map((item) => [item.id, item]));
      const reordered = savedIds.flatMap((id) => {
        const item = idToItem.get(id);
        return item ? [item] : [];
      });
      const savedSet = new Set(savedIds);
      const newItems = exploreItems.filter((item) => !savedSet.has(item.id));
      setDisplayItems([...reordered, ...newItems]);
    } else {
      sessionStorage.setItem(EXPLORE_SESSION_KEY, JSON.stringify(exploreItems.map((i) => i.id)));
      setDisplayItems(exploreItems);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Notifica l'header dello stato di loading tramite custom event
  useEffect(() => {
    window.dispatchEvent(new CustomEvent('search-loading', { detail: { loading } }));
  }, [loading]);

  // Reset immediato quando l'utente preme X nell'header (optimistic clear)
  useEffect(() => {
    function handleClear() {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      setResults({ users: [], sightings: [] });
      setLoading(false);
    }
    window.addEventListener('search-clear', handleClear);
    return () => window.removeEventListener('search-clear', handleClear);
  }, []);

  // Ricerca al cambio query
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!query.trim()) {
      setResults({ users: [], sightings: [] });
      setLoading(false);
      return;
    }
    setLoading(true);
    debounceRef.current = setTimeout(() => {
      startTransition(async () => {
        const r = await search(query);
        setResults(r);
        setLoading(false);
      });
    }, DEBOUNCE_MS);
  }, [query]);

  const showResults = query.trim().length > 0;

  if (!showResults) {
    const indicatorY = isRefreshing ? 12 : Math.min(pullProgress, 1) * 56 - 44;
    const indicatorOpacity = isRefreshing ? 1 : Math.min(pullProgress * 1.5, 1);
    const iconRotation = pullProgress * 360;
    const showIndicator = pullProgress > 0 || isRefreshing;

    return (
      <div className="flex-1 relative overflow-hidden">
        {showIndicator && (
          <div
            className="absolute left-1/2 z-10 flex items-center justify-center w-10 h-10 rounded-full bg-card border border-border shadow-md pointer-events-none"
            style={{
              top: 0,
              transform: `translateX(-50%) translateY(${indicatorY}px)`,
              opacity: indicatorOpacity,
              transition: pullProgress === 0 ? 'transform 300ms ease-out, opacity 300ms ease-out' : 'none',
            }}
          >
            <RefreshCw
              className={cn('w-5 h-5 text-primary', isRefreshing && 'animate-spin')}
              style={isRefreshing ? undefined : { transform: `rotate(${iconRotation}deg)` }}
            />
          </div>
        )}
        <div ref={scrollRef} className="h-full overflow-y-auto">
          {displayItems === null ? <ThumbSkeleton count={30} /> : <ThumbGrid items={displayItems} />}
        </div>
      </div>
    );
  }

  return (
    <Tabs
      value={tab}
      onValueChange={(v) => setTab(v as Tab)}
      className="flex flex-col flex-1 overflow-hidden gap-0"
    >
      <TabsList variant="line" className="w-full rounded-none border-b p-0 gap-0 shrink-0">
        <TabsTrigger value="utenti" className="flex-1 rounded-none border-none h-full p-0">
          <Users className="w-4 h-4" />
          Utenti
          {results.users.length > 0 && (
            <span className={cn('text-xs ml-1', tab === 'utenti' ? 'text-primary' : 'text-muted-foreground')}>
              {results.users.length}
            </span>
          )}
        </TabsTrigger>
        <TabsTrigger value="gatti" className="flex-1 rounded-none border-none h-full p-0">
          <Cat className="w-4 h-4" />
          Gatti
          {results.sightings.length > 0 && (
            <span className={cn('text-xs ml-1', tab === 'gatti' ? 'text-primary' : 'text-muted-foreground')}>
              {results.sightings.length}
            </span>
          )}
        </TabsTrigger>
      </TabsList>

      <div
        className="flex flex-col flex-1 overflow-hidden"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <TabsContent value="utenti" className="flex-1 mt-0 overflow-y-auto">
          {results.users.length === 0 && !loading ? (
            <EmptyTab message={`Nessun utente trovato per "${query}"`} />
          ) : (
            <div className="flex flex-col divide-y divide-border">
              {results.users.map((user) => (
                <UserRow key={user.id} user={user} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="gatti" className="flex-1 mt-0 overflow-y-auto">
          {results.sightings.length === 0 && !loading ? (
            <EmptyTab message={`Nessun gatto trovato per "${query}"`} />
          ) : (
            <div className="flex flex-col divide-y divide-border">
              {results.sightings.map((s) => (
                <SightingRow key={s.id} sighting={s} />
              ))}
            </div>
          )}
        </TabsContent>
      </div>
    </Tabs>
  );
}
