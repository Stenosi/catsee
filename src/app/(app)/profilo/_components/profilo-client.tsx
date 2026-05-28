'use client';
import Link from 'next/link';
import { useState } from 'react';
import { useTabSwipe } from '@/hooks/use-tab-swipe';
import { usePersistedTab } from '@/lib/use-persisted-tab';
import ImageLightbox from '@/components/image-lightbox';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { buttonVariants } from '@/components/ui/button';
import {
    Empty,
    EmptyContent,
    EmptyDescription,
    EmptyHeader,
    EmptyMedia,
    EmptyTitle,
} from '@/components/ui/empty';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Cat, Pencil, Award, MapPin, Frown, LayoutGrid } from 'lucide-react';
import { cn } from '@/lib/utils';
import ProfileMapView from './profile-map-view';
import type { ProfileMapSighting } from './profile-map-inner';

const TABS = ['post', 'mappa'] as const;
type Tab = (typeof TABS)[number];

function ThumbImage({ src, alt }: { src: string; alt: string }) {
    const [loaded, setLoaded] = useState(false);
    return (
        <div className="relative w-full h-full">
            {!loaded && <Skeleton className="absolute inset-0 rounded-none" />}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
                src={src}
                alt={alt}
                onLoad={() => setLoaded(true)}
                className={cn('w-full h-full object-cover transition-opacity duration-500', loaded ? 'opacity-100' : 'opacity-0')}
            />
        </div>
    );
}

interface PostPreview {
    id: string;
    thumbnailUrl: string;
    catNickname: string;
}

interface Props {
    nickname: string;
    username: string;
    bio: string | null;
    avatarUrl: string | null;
    catCount: number;
    followerCount: number;
    followingCount: number;
    posts: PostPreview[];
    mapSightings: ProfileMapSighting[];
}

export default function ProfiloClient({
    nickname,
    username,
    bio,
    avatarUrl,
    catCount,
    followerCount,
    followingCount,
    posts,
    mapSightings,
}: Props) {
    const [status, setStatus] = useState<'loading' | 'loaded' | 'error' | 'idle'>(
        avatarUrl ? 'loading' : 'idle',
    );
    const [avatarLightbox, setAvatarLightbox] = useState(false);
    const [tab, setTab] = usePersistedTab('tab:/profilo', 'post', TABS);
    const { handleTouchStart, handleTouchEnd: swipeEnd } = useTabSwipe(tab, setTab, TABS);
    // Leaflet cattura i touch sulla mappa - disabilitiamo lo swipe quando siamo su quella tab
    function handleTouchEnd(e: React.TouchEvent) {
        if (tab === 'mappa') return;
        swipeEnd(e);
    }

    const formattedFollowers = followerCount.toLocaleString('it-IT');
    const formattedFollowing = followingCount.toLocaleString('it-IT');

    return (
        <>
            {avatarUrl && (
                <ImageLightbox
                    src={avatarUrl}
                    alt={`Foto profilo di ${nickname}`}
                    open={avatarLightbox}
                    onClose={() => setAvatarLightbox(false)}
                    circle
                />
            )}
            <div className="flex flex-col h-full">

                {/* Intestazione profilo */}
                <div className="flex flex-col gap-3 px-3 pt-5 pb-3">
                    <div className="flex items-center gap-8 px-2">

                        {/* Avatar con skeleton di caricamento */}
                        <div
                            className="relative"
                            onClick={() => avatarUrl && status === 'loaded' && setAvatarLightbox(true)}
                        >
                            <Avatar size="2xl" className={cn('overflow-hidden', avatarUrl && status === 'loaded' && 'cursor-pointer')}>
                                {avatarUrl && (
                                    <AvatarImage
                                        src={avatarUrl}
                                        alt={`Foto profilo di ${nickname}`}
                                        onLoadingStatusChange={(s) => setStatus(s)}
                                        className={cn(
                                            'transition-opacity duration-300',
                                            status === 'loaded' ? 'opacity-100' : 'opacity-0',
                                        )}
                                    />
                                )}
                                <AvatarFallback>
                                    {(nickname.trim().split(/\s+/).length >= 2
                                        ? nickname.trim().split(/\s+/).slice(0, 2).map(w => w[0]).join('')
                                        : nickname.slice(0, 2)
                                    ).toUpperCase()}
                                </AvatarFallback>
                            </Avatar>
                            {status === 'loading' && (
                                <Skeleton className="absolute inset-0 rounded-full h-full w-full" />
                            )}
                        </div>

                        <div className="flex flex-col justify-center gap-2 w-full">

                            {/* Nome + badge gatti avvistati */}
                            <div className="flex items-center gap-2">
                                <h1 className="font-semibold text-foreground">{nickname}</h1>
                                <Badge
                                    variant="default"
                                    className="text-xs font-semibold"
                                    aria-label={`${catCount} gatti avvistati`}
                                >
                                    <Cat aria-hidden="true" data-icon="inline-end" />
                                    {catCount}
                                </Badge>
                            </div>

                            <dl className="flex gap-10 text-xs font-medium">
                                <Link
                                    href="/profilo/follow?tab=follower"
                                    className="flex flex-col items-center -space-y-1 active:opacity-60 transition-opacity"
                                >
                                    <dd className="text-foreground">{formattedFollowers}</dd>
                                    <dt className="text-muted-foreground">follower</dt>
                                </Link>
                                <Link
                                    href="/profilo/follow?tab=seguiti"
                                    className="flex flex-col items-center -space-y-1 active:opacity-60 transition-opacity"
                                >
                                    <dd className="text-foreground">{formattedFollowing}</dd>
                                    <dt className="text-muted-foreground">seguiti</dt>
                                </Link>
                            </dl>

                        </div>
                    </div>

                    {/* Bio */}
                    {bio && (
                        <p className="text-xs text-muted-foreground whitespace-pre-wrap">{bio}</p>
                    )}

                    {/* Azioni */}
                    <div className="w-full flex gap-2">
                        <Link
                            href="/profilo/modifica"
                            className={cn(buttonVariants({ size: 'sm', variant: 'secondary' }), 'flex-1')}
                        >
                            <Pencil aria-hidden="true" data-icon="inline-start" />
                            Modifica profilo
                        </Link>
                        <Link
                            href="/profilo/badge"
                            className={cn(buttonVariants({ size: 'sm', variant: 'secondary' }), 'flex-1')}
                        >
                            <Award aria-hidden="true" data-icon="inline-start" />
                            Mostra badge
                        </Link>
                    </div>
                </div>

                {/* Tab Post / Mappa */}
                <Tabs value={tab} onValueChange={(v) => setTab(v as Tab)} className="flex flex-col flex-1 gap-0">
                    <TabsList variant="line" className="w-full rounded-none border-b p-0 gap-0">
                        <TabsTrigger value="post" className="flex-1 rounded-none border-none h-full p-0">
                            <LayoutGrid />
                            Post
                        </TabsTrigger>
                        <TabsTrigger value="mappa" className="flex-1 rounded-none border-none h-full p-0">
                            <MapPin />
                            Mappa
                        </TabsTrigger>
                    </TabsList>

                    <div
                        className="flex flex-col flex-1"
                        onTouchStart={handleTouchStart}
                        onTouchEnd={handleTouchEnd}
                    >
                        <TabsContent value="post" className="flex-1 mt-0">
                            {posts.length === 0 ? (
                                <Empty className="rounded-none h-full">
                                    <EmptyMedia>
                                        <Frown className="w-10 h-10 opacity-40" aria-hidden="true" />
                                    </EmptyMedia>
                                    <EmptyHeader>
                                        <EmptyTitle>Nessun gatto qui</EmptyTitle>
                                        <EmptyDescription>Non hai ancora avvistato nessun gatto.</EmptyDescription>
                                    </EmptyHeader>
                                    <EmptyContent>
                                        <Link href="/scatta" className={buttonVariants({ size: 'lg' })}>
                                            Inizia ora!
                                        </Link>
                                    </EmptyContent>
                                </Empty>
                            ) : (
                                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-px">
                                    {posts.map((post) => (
                                        <Link key={post.id} href={`/post/${post.id}`} className="aspect-square overflow-hidden block">
                                            <ThumbImage src={post.thumbnailUrl} alt={post.catNickname} />
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </TabsContent>

                        <TabsContent value="mappa" className="flex-1 mt-0">
                            {mapSightings.length === 0 ? (
                                <Empty className="rounded-none h-full">
                                    <EmptyMedia>
                                        <MapPin className="w-10 h-10 opacity-40" aria-hidden="true" />
                                    </EmptyMedia>
                                    <EmptyHeader>
                                        <EmptyTitle>Nessun avvistamento</EmptyTitle>
                                        <EmptyDescription>
                                            I tuoi gatti appariranno qui con le coordinate precise, visibili solo a te.
                                        </EmptyDescription>
                                    </EmptyHeader>
                                </Empty>
                            ) : (
                                <div className="h-full">
                                    <ProfileMapView sightings={mapSightings} />
                                </div>
                            )}
                        </TabsContent>
                    </div>
                </Tabs>

            </div>
        </>
    );
}
