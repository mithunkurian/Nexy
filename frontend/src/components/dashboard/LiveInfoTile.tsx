"use client";
import { useState } from "react";
import { useLiveInfo } from "@/hooks/useLiveInfo";
import { ChevronRight } from "lucide-react";
import { LiveInfoPage } from "@/components/LiveInfoPage";

function minuteLabel(min: number): string {
  return min === 0 ? "Now" : `${min} min`;
}

const ELEC_LEVEL_DOT = {
  cheap:     "bg-emerald-400",
  normal:    "bg-amber-400",
  expensive: "bg-red-400",
};

export function LiveInfoTile() {
  const { weather, routeDepartures, electricity } = useLiveInfo();
  const [open, setOpen] = useState(false);

  // Don't render if there's nothing to show
  if (!weather && routeDepartures.length === 0 && !electricity) return null;

  // Build the one-line summary shown in the tile
  const summaryParts: string[] = [];
  if (weather) summaryParts.push(`${weather.emoji} ${weather.temp}°C · ${weather.label}`);

  // Show first departure of first route
  const firstRoute = routeDepartures[0];
  if (firstRoute && firstRoute.minutes.length > 0) {
    summaryParts.push(`🚌 ${minuteLabel(firstRoute.minutes[0])} → ${firstRoute.route.toStop.split(" (")[0]}`);
  }

  if (electricity) summaryParts.push(`⚡ ${electricity.priceNow} öre`);

  return (
    <>
      {/* ── Compact tile — tap to open full page ──────────────────────────── */}
      <button
        onClick={() => setOpen(true)}
        className="w-full flex items-center justify-between px-4 py-3 rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-sm hover:bg-gray-50 dark:hover:bg-gray-800/60 transition-colors text-left"
      >
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider flex-shrink-0">
            Live Info
          </span>
          {summaryParts.length > 0 && (
            <span className="text-xs text-gray-500 dark:text-gray-400 truncate">
              · {summaryParts.join("  ·  ")}
            </span>
          )}
          {electricity && (
            <span className={`flex-shrink-0 w-1.5 h-1.5 rounded-full ${ELEC_LEVEL_DOT[electricity.level]}`} />
          )}
        </div>
        <ChevronRight size={15} className="text-gray-400 flex-shrink-0 ml-2" />
      </button>

      {/* ── Full-page modal ────────────────────────────────────────────────── */}
      {open && <LiveInfoPage onClose={() => setOpen(false)} />}
    </>
  );
}
