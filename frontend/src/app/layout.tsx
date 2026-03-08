import type { Metadata, Viewport } from "next";
import "./globals.css";
import { LayoutShell } from "@/components/LayoutShell";
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
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-gray-50 dark:bg-gray-950 transition-colors">
        <SettingsProvider>
          <LayoutShell>{children}</LayoutShell>
        </SettingsProvider>
      </body>
    </html>
  );
}
