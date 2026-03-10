"use client";
import { usePathname } from "next/navigation";
import { useLandscape } from "@/hooks/useLandscape";
import { BottomNav } from "@/components/BottomNav";
import { SideNav } from "@/components/SideNav";

/**
 * Switches between portrait layout (bottom nav) and
 * landscape kiosk layout (side nav, full-height, no-scroll).
 * On the login page the nav shell is skipped entirely.
 */
export function LayoutShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const landscape = useLandscape();

  // Login page renders full-screen with no navigation chrome
  if (pathname === "/login") return <>{children}</>;


  if (landscape) {
    return (
      <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-gray-950">
        <SideNav />
        <main className="flex-1 ml-16 h-screen overflow-hidden">
          {children}
        </main>
      </div>
    );
  }

  return (
    <>
      <main className="flex-1 pb-24">{children}</main>
      <BottomNav />
    </>
  );
}
