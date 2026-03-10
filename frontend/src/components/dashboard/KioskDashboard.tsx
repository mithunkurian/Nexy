"use client";
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

/**
 * Landscape kiosk dashboard — everything fits on one screen, no scrolling.
 * Used automatically when the device is in landscape orientation.
 *
 * Layout:
 *   Left panel (42%): greeting · stats · live info · ask bar
 *   Right panel (58%): control tiles · quick scenes · activity
 */
export default function KioskDashboard() {
  const { devices, rooms, loading } = useDevices();

  return (
    <div className="h-full flex gap-3 p-3 overflow-hidden">

      {/* ── Left panel ──────────────────────────────────────────── */}
      <div className="flex flex-col gap-3 w-[42%] min-w-0 overflow-hidden">

        {/* Version badge — top left */}
        <p className="text-left text-[10px] text-gray-300 dark:text-gray-600 select-none leading-none">
          {VERSION_LABEL}
        </p>

        {/* Greeting card */}
        <GreetingHeader />

        {/* Stats row */}
        {!loading && <StatsOverview devices={devices} rooms={rooms} />}

        {/* Live info (weather / bus / electricity) */}
        <LiveInfoTile />

        {/* Push ask bar to bottom */}
        <div className="flex-1 min-h-0" />

        {/* Ask Nexy bar */}
        <AskNexyBar />
      </div>

      {/* ── Right panel ─────────────────────────────────────────── */}
      <div className="flex flex-col gap-3 flex-1 min-w-0 overflow-hidden">

        {loading ? (
          <div className="flex-1 flex items-center justify-center text-gray-300 dark:text-gray-600">
            <div className="flex flex-col items-center gap-2">
              <Loader2 size={24} className="animate-spin" />
              <span className="text-sm">Connecting to your home…</span>
            </div>
          </div>
        ) : (
          <>
            {/* Security / safety banner */}
            <HomeStatusBanner devices={devices} />

            {/* Control tiles — 4-column grid */}
            <ControlTiles devices={devices} />

            {/* Quick scenes */}
            <QuickScenes />

            {/* Activity feed — fills remaining space, hides overflow */}
            <div className="flex-1 min-h-0 overflow-hidden">
              <ActivityFeed />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
