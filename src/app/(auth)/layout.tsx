export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-full bg-background overflow-y-auto">
      {children}
    </div>
  );
}
