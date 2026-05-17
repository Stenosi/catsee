'use client';
import Link from "next/link";
import { useState, useRef } from "react";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Cat, Pencil, Award, MapPin, Frown, LayoutGrid } from "lucide-react";
import { cn } from "@/lib/utils";

const TABS = ["post", "mappa"] as const;
type Tab = typeof TABS[number];

export default function ProfiloPage() {
  const [status, setStatus] = useState<"loading" | "loaded" | "error" | "idle">("loading");
  const [tab, setTab] = useState<Tab>("post");
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
    const i = TABS.indexOf(tab);
    if (deltaX < 0 && i < TABS.length - 1) setTab(TABS[i + 1]);
    if (deltaX > 0 && i > 0) setTab(TABS[i - 1]);
  }

  return (
    <div className="flex flex-col h-full">

      {/* Intestazione profilo */}
      <div className="flex flex-col gap-3 px-3 pt-5 pb-3">
        <div className="flex items-center gap-8 px-2">

          {/* Avatar con skeleton di caricamento */}
          <div className="relative">
            <Avatar size="2xl" className="overflow-hidden">
              <AvatarImage
                src="https://github.com/shadcn.png"
                alt="Foto profilo di Davide Marsili"
                onLoadingStatusChange={(s) => setStatus(s)}
                className={cn(
                  "transition-opacity duration-300",
                  status === "loaded" ? "opacity-100" : "opacity-0"
                )}
              />
            </Avatar>
            {status === "loading" && (
              <Skeleton className="absolute inset-0 rounded-full h-full w-full" />
            )}
          </div>

          <div className="flex flex-col justify-center gap-2 w-full">

            {/* Nome + badge gatti avvistati */}
            <div className="flex items-center gap-2">
              <h1 className="font-semibold text-foreground">Davide Marsili</h1>
              <Badge
                variant="default"
                className="text-xs font-semibold"
                aria-label="75 gatti avvistati"
              >
                <Cat aria-hidden="true" data-icon="inline-end" />
                75
              </Badge>
            </div>

            <dl className="flex gap-4 text-xs font-medium">
              <div className="flex flex-col items-center -space-y-1">
                <dd className="text-foreground">353</dd>
                <dt className="text-muted-foreground">follower</dt>
              </div>
              <div className="flex flex-col items-center -space-y-1">
                <dd className="text-foreground">1.789</dd>
                <dt className="text-muted-foreground">seguiti</dt>
              </div>
            </dl>

          </div>
        </div>

        {/* Bio */}
        <p className="text-xs text-muted-foreground">
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus a turpis lacus.
          Pellentesque ac lacinia eros. Sed tincidunt tempor facilisis.
        </p>

        {/* Azioni */}
        <div className="w-full flex gap-2">
          <Button size="sm" variant="secondary" className="flex-1">
            <Pencil aria-hidden="true" data-icon="inline-start" />
            Modifica profilo
          </Button>
          <Button size="sm" variant="secondary" className="flex-1">
            <Award aria-hidden="true" data-icon="inline-start" />
            Mostra badge
          </Button>
        </div>
      </div>

      {/* Tab Post / Mappa */}
      <Tabs value={tab} onValueChange={(v) => setTab(v as Tab)} className="flex flex-col flex-1">
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

        <div className="flex flex-col flex-1" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>

          {/* Tab Post — empty state */}
          <TabsContent value="post" className="flex-1 mt-0">
            <Empty className="rounded-none h-full">
              <EmptyMedia>
                <Frown className="w-10 h-10 opacity-40" aria-hidden="true" />
              </EmptyMedia>
              <EmptyHeader>
                <EmptyTitle>Nessun gatto qui</EmptyTitle>
                <EmptyDescription>Non hai ancora avvistato nessun gatto.</EmptyDescription>
              </EmptyHeader>
              <EmptyContent>
                <Link href="/scatta" className={buttonVariants({ size: "lg" })}>
                  Inizia ora!
                </Link>
              </EmptyContent>
            </Empty>
          </TabsContent>

          {/* Tab Mappa personale — placeholder MVP */}
          <TabsContent value="mappa" className="flex-1 mt-0">
            <Empty className="rounded-none h-full">
              <EmptyMedia>
                <MapPin className="w-10 h-10 opacity-40" aria-hidden="true" />
              </EmptyMedia>
              <EmptyHeader>
                <EmptyTitle>La tua mappa personale</EmptyTitle>
                <EmptyDescription>
                  Presto potrai vedere tutti i gatti che hai avvistato sulla mappa,
                  con le coordinate precise visibili solo a te.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          </TabsContent>

        </div>
      </Tabs>

    </div>
  );
}
