"use client";
import { useLandscape } from "@/hooks/useLandscape";
import KioskDashboard from "@/components/dashboard/KioskDashboard";
import { useDevices } from "@/hooks/useDevices";
import { GreetingHeader } from "@/components/dashboard/GreetingHeader";
import { HomeStatusBanner } from "@/components/dashboard/HomeStatusBanner";
import { StatsOverview } from "@/components/dashboard/StatsOverview";
import { ControlTiles } from "@/components/dashboard/ControlTiles";
import { QuickScenes } from "@/components/dashboard/QuickScenes";
import { ActivityFeed } from "@/components/dashboard/ActivityFeed";
import { AskNexyBar } from "@/components/dashboard/AskNexyBar";
import { LiveInfoTile } from "@/components/dashboard/LiveInfoTile";
import { Loader2 } from "lucide-react";
import { VERSION_LABEL } from "@/lib/version";

export default function HomeClient() {
  const landscape = useLandscape();

  // Landscape → kiosk view (no scroll, two-column tablet layout)
  if (landscape) return <KioskDashboard />;

  // Portrait → original phone layout (unchanged)
  return <PortraitDashboard />;
}

function PortraitDashboard() {
  const { devices, rooms, loading } = useDevices();

  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-5">
      {/* 1 — Greeting (always visible, reads from Settings) */}
      <GreetingHeader />

      {/* Live info — weather, bus, electricity */}
      <LiveInfoTile />

      {loading ? (
        <div className="flex flex-col items-center py-14 gap-3 text-gray-300 dark:text-gray-600">
          <Loader2 size={28} className="animate-spin" />
          <span className="text-sm">Connecting to your home…</span>
        </div>
      ) : (
        <>
          {/* 2 — Security / safety overview */}
          <HomeStatusBanner devices={devices} />

          {/* 3 — Stats row */}
          <StatsOverview devices={devices} rooms={rooms} />

          {/* 4 — Control tiles (tap to navigate to category) */}
          <ControlTiles devices={devices} />

          {/* 5 — Quick AI scenes */}
          <QuickScenes />

          {/* 6 — Recent activity log */}
          <ActivityFeed />
        </>
      )}

      {/* 7 — Nexy AI bar (always visible at bottom) */}
      <AskNexyBar />

      {/* 8 — Version badge */}
      <p className="text-center text-[11px] text-gray-300 dark:text-gray-600 pb-2 select-none">
        {VERSION_LABEL}
      </p>
    </div>
  );
}
