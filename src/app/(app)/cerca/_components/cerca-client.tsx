'use client';

import { useState, useRef, useTransition, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Cat, Users } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { search, type ExploreThumb, type UserResult, type SightingResult } from '../actions';

const DEBOUNCE_MS = 350;
const EXPLORE_SESSION_KEY = 'explore_order_v1';
const TABS = ['utenti', 'gatti'] as const;
type Tab = (typeof TABS)[number];

// ─── Griglia esplora ──────────────────────────────────────────────────────────

function ThumbSkeleton({ count }: { count: number }) {
  return (
    <div className="grid grid-cols-3 gap-px">
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className="aspect-square rounded-none" />
      ))}
    </div>
  );
}

function ThumbGrid({ items }: { items: ExploreThumb[] }) {
  return (
    <div className="grid grid-cols-3 gap-px animate-in fade-in duration-300">
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
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);

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
    const i = TABS.indexOf(tab);
    if (deltaX < 0 && i < TABS.length - 1) setTab(TABS[i + 1]);
    if (deltaX > 0 && i > 0) setTab(TABS[i - 1]);
  }

  const showResults = query.trim().length > 0;

  if (!showResults) {
    return (
      <div className="flex-1 overflow-y-auto">
        {displayItems === null ? <ThumbSkeleton count={30} /> : <ThumbGrid items={displayItems} />}
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
