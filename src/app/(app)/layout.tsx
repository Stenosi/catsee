import { Suspense } from "react";
import { getSession } from "@/lib/session";
import AppHeader from "@/components/app-header";
import BottomNavbar from "@/components/bottom-navbar";
import InstallBanner from "@/components/install-banner";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Suspense>
        <AppHeader username={session?.user?.username ?? null} />
      </Suspense>
      <main className="flex-1 overflow-y-auto isolate">{children}</main>
      <BottomNavbar />
      <InstallBanner />
    </div>
  );
}
