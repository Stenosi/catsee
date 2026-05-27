import { Suspense } from "react";
import AppHeaderServer from "@/components/app-header-server";
import BottomNavbar from "@/components/bottom-navbar";
import InstallBanner from "@/components/install-banner";

function HeaderSkeleton() {
  return <div className="shrink-0 h-14 bg-card border-b border-border" />;
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Suspense fallback={<HeaderSkeleton />}>
        <AppHeaderServer />
      </Suspense>
      <main className="flex-1 overflow-y-auto isolate">{children}</main>
      <BottomNavbar />
      <InstallBanner />
    </div>
  );
}
