import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans, Geist_Mono } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const jakartaSans = Plus_Jakarta_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const viewport: Viewport = {
  viewportFit: "cover",
  themeColor: "#fff0e9",
};

export const metadata: Metadata = {
  title: "CatSee",
  description: "Avvista i gatti del tuo quartiere",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "CatSee",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="it"
      className={`${jakartaSans.variable} ${geistMono.variable} antialiased`}
    >
      <body className="h-full overflow-hidden">
        {children}
        <Toaster position="top-center" richColors />
      </body>
    </html>
  );
}
