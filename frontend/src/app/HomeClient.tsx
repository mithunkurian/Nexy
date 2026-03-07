"use client";
import { useState } from "react";
import { useDevices } from "@/hooks/useDevices";
import { GreetingHeader }    from "@/components/dashboard/GreetingHeader";
import { HomeStatusBanner }  from "@/components/dashboard/HomeStatusBanner";
import { StatsOverview }     from "@/components/dashboard/StatsOverview";
import { ControlTiles }      from "@/components/dashboard/ControlTiles";
import { QuickScenes }       from "@/components/dashboard/QuickScenes";
import { ActivityFeed }      from "@/components/dashboard/ActivityFeed";
import { AskNexyBar }        from "@/components/dashboard/AskNexyBar";
import { LiveInfoBar }       from "@/components/dashboard/LiveInfoBar";
import { LiveInfoModal }     from "@/components/dashboard/LiveInfoModal";
import { Loader2 }           from "lucide-react";
import { VERSION_LABEL }     from "@/lib/version";

export default function HomeClient() {
  const { devices, rooms, loading } = useDevices();
  const [liveInfoOpen, setLiveInfoOpen] = useState(false);

  return (
    <>
      {/* Live Info modal — rendered outside the grid so it overlays everything */}
      <LiveInfoModal open={liveInfoOpen} onClose={() => setLiveInfoOpen(false)} />

      {/*
       * LAYOUT SYSTEM
       * ─────────────────────────────────────────────────────────────────────
       * Portrait  (< 1024 px): single centred column, normal scroll
       * Kiosk     (≥ 1024 px): 2-column grid, fixed height, no outer scroll
       *   Left  ~380px  → greeting / status / stats / live-info bar
       *   Right fills   → controls / scenes / activity / ask-nexy
       * ─────────────────────────────────────────────────────────────────────
       */}
      <div
        className={[
          // ── Portrait (base) ───────────────────────────────────────
          "max-w-lg mx-auto px-4 py-6 space-y-4",
          // ── Kiosk tablet landscape (lg: ≥1024 px) ─────────────────
          "lg:max-w-none lg:space-y-0",
          "lg:grid lg:grid-cols-[380px_1fr] lg:gap-4",
          "lg:p-4 lg:h-[calc(100dvh-6rem)] lg:overflow-hidden",
        ].join(" ")}
      >
        {/* ══ LEFT COLUMN ══════════════════════════════════════════════════ */}
        <div className="space-y-4 lg:space-y-0 lg:flex lg:flex-col lg:gap-3 lg:overflow-hidden lg:min-h-0">

          {/* Greeting — always visible */}
          <GreetingHeader />

          {/* Status + stats — hide while connecting */}
          {!loading && (
            <>
              <HomeStatusBanner devices={devices} />
              <StatsOverview devices={devices} rooms={rooms} />
            </>
          )}

          {/* Live info compact bar — taps to open modal */}
          <LiveInfoBar onOpen={() => setLiveInfoOpen(true)} />
        </div>

        {/* ══ RIGHT COLUMN ═════════════════════════════════════════════════ */}
        <div className="space-y-4 lg:space-y-0 lg:flex lg:flex-col lg:gap-3 lg:overflow-hidden lg:min-h-0">

          {loading ? (
            /* Connecting spinner */
            <div className="flex flex-col items-center py-14 gap-3 text-gray-300 dark:text-gray-600">
              <Loader2 size={28} className="animate-spin" />
              <span className="text-sm">Connecting to your home…</span>
            </div>
          ) : (
            <>
              {/* Device control tiles (4-col grid at sm+) */}
              <ControlTiles devices={devices} />

              {/* Quick scene buttons */}
              <QuickScenes />

              {/* Activity feed — grows & scrolls internally in kiosk mode */}
              <ActivityFeed className="lg:flex-1 lg:min-h-0 lg:flex lg:flex-col" />
            </>
          )}

          {/* Ask Nexy bar — always at the bottom of this column */}
          <AskNexyBar />

          {/* Version badge */}
          <p className="text-center text-[11px] text-gray-300 dark:text-gray-600 pb-2 select-none">
            {VERSION_LABEL}
          </p>
        </div>
      </div>
    </>
  );
}
