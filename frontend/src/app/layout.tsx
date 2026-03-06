import type { Metadata, Viewport } from "next";
import "./globals.css";
import { BottomNav } from "@/components/BottomNav";
import { SettingsProvider } from "@/contexts/SettingsContext";

export const metadata: Metadata = {
  title: "Nexy — Smart Home AI",
  description: "Control your smart home with natural language",
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  themeColor: "#ffffff",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col transition-colors">
        <SettingsProvider>
          <main className="flex-1 pb-24">{children}</main>
          <BottomNav />
        </SettingsProvider>
      </body>
    </html>
  );
}
