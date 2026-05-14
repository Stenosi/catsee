import AppHeader from "@/components/app-header";
import BottomNavbar from "@/components/bottom-navbar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col h-dvh overflow-hidden">
      <AppHeader />
      <main className="flex-1 overflow-y-auto">{children}</main>
      <BottomNavbar />
    </div>
  );
}
