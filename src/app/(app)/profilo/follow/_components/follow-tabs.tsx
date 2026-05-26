'use client';

import { useState, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty';
import { Users } from 'lucide-react';
import type { FollowUser } from '../../actions';

const TABS = ['follower', 'seguiti'] as const;
type Tab = (typeof TABS)[number];

function UserRow({ user }: { user: FollowUser }) {
  return (
    <Link
      href={`/profilo/${user.username}`}
      className="flex items-center gap-3 px-4 py-3 border-b border-border last:border-b-0 active:bg-muted transition-colors"
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
    </Link>
  );
}

interface Props {
  defaultTab: Tab;
  followers: FollowUser[];
  following: FollowUser[];
}

function filterUsers(users: FollowUser[], query: string) {
  const q = query.toLowerCase().trim();
  if (!q) return users;
  return users.filter(
    (u) => u.username.toLowerCase().includes(q) || u.nickname.toLowerCase().includes(q),
  );
}

export default function FollowTabs({ defaultTab, followers, following }: Props) {
  const [tab, setTab] = useState<Tab>(defaultTab);
  const searchParams = useSearchParams();
  const query = searchParams.get('q') ?? '';
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);

  const filteredFollowers = filterUsers(followers, query);
  const filteredFollowing = filterUsers(following, query);

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

  return (
    <Tabs value={tab} onValueChange={(v) => setTab(v as Tab)} className="flex flex-col h-full gap-0">
      <TabsList variant="line" className="w-full rounded-none border-b p-0 gap-0 shrink-0">
        <TabsTrigger value="follower" className="flex-1 rounded-none border-none h-full p-0">
          Follower
          {filteredFollowers.length > 0 && (
            <span className="text-xs ml-1 text-muted-foreground">{filteredFollowers.length}</span>
          )}
        </TabsTrigger>
        <TabsTrigger value="seguiti" className="flex-1 rounded-none border-none h-full p-0">
          Seguiti
          {filteredFollowing.length > 0 && (
            <span className="text-xs ml-1 text-muted-foreground">{filteredFollowing.length}</span>
          )}
        </TabsTrigger>
      </TabsList>

      <div className="flex flex-col flex-1 overflow-hidden" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
        <TabsContent value="follower" className="flex-1 mt-0 overflow-y-auto">
          {filteredFollowers.length === 0 ? (
            <Empty className="h-full">
              <EmptyMedia><Users className="w-10 h-10 opacity-40" /></EmptyMedia>
              <EmptyHeader>
                <EmptyTitle>{query ? 'Nessun risultato' : 'Nessun follower ancora'}</EmptyTitle>
                <EmptyDescription>
                  {query ? `Nessun follower corrisponde a "${query}".` : 'Quando qualcuno ti seguirà, apparirà qui.'}
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <div className="flex flex-col">
              {filteredFollowers.map((u) => <UserRow key={u.id} user={u} />)}
            </div>
          )}
        </TabsContent>

        <TabsContent value="seguiti" className="flex-1 mt-0 overflow-y-auto">
          {filteredFollowing.length === 0 ? (
            <Empty className="h-full">
              <EmptyMedia><Users className="w-10 h-10 opacity-40" /></EmptyMedia>
              <EmptyHeader>
                <EmptyTitle>{query ? 'Nessun risultato' : 'Non segui ancora nessuno'}</EmptyTitle>
                <EmptyDescription>
                  {query ? `Nessun seguito corrisponde a "${query}".` : 'Cerca utenti e inizia a seguirli.'}
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <div className="flex flex-col">
              {filteredFollowing.map((u) => <UserRow key={u.id} user={u} />)}
            </div>
          )}
        </TabsContent>
      </div>
    </Tabs>
  );
}
