import type { Metadata, Viewport } from "next";
import "./globals.css";
import { LayoutShell } from "@/components/LayoutShell";
import { SettingsProvider } from "@/contexts/SettingsContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { RouteGuard } from "@/components/RouteGuard";

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
          <AuthProvider>
            <RouteGuard>
              <LayoutShell>{children}</LayoutShell>
            </RouteGuard>
          </AuthProvider>
        </SettingsProvider>
      </body>
    </html>
  );
}
