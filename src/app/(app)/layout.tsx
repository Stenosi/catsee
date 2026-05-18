import { requireOnboardedSession } from "@/lib/session";
import AppHeader from "@/components/app-header";
import BottomNavbar from "@/components/bottom-navbar";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await requireOnboardedSession();

  return (
    <div className="flex flex-col h-dvh overflow-hidden">
      <AppHeader username={session.user.username} />
      <main className="flex-1 overflow-y-auto">{children}</main>
      <BottomNavbar />
    </div>
  );
}
