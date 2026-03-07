"use client";
import { useState, useEffect } from "react";
import { useLiveInfo } from "@/hooks/useLiveInfo";
import { useSettings } from "@/contexts/SettingsContext";
import { Cloud, Bus, Zap, ChevronRight, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

const COLLAPSE_KEY = "nexy_liveinfo_collapsed";

function minuteLabel(min: number): string {
  return min === 0 ? "Now" : `${min} min`;
}

const ELEC_LEVEL = {
  cheap:     { label: "Cheap now",  color: "text-emerald-600", bg: "bg-emerald-50", dot: "bg-emerald-400" },
  normal:    { label: "Normal",     color: "text-amber-600",   bg: "bg-amber-50",   dot: "bg-amber-400" },
  expensive: { label: "High price", color: "text-red-600",     bg: "bg-red-50",     dot: "bg-red-400" },
};

export function LiveInfoTile() {
  const { settings } = useSettings();
  const { weather, departuresTo, departuresFrom, electricity } = useLiveInfo();

  // Persist collapsed state in localStorage
  const [collapsed, setCollapsed] = useState(true);
  useEffect(() => {
    const stored = localStorage.getItem(COLLAPSE_KEY);
    if (stored !== null) setCollapsed(stored === "true");
  }, []);

  function toggle() {
    const next = !collapsed;
    setCollapsed(next);
    localStorage.setItem(COLLAPSE_KEY, String(next));
  }

  const stopB   = settings.commuteStopB;
  const hasBus  = departuresTo.length > 0 || departuresFrom.length > 0;

  // Don't render if there's nothing to show
  if (!weather && !hasBus && !electricity) return null;

  // ── Compact one-line summary shown when collapsed ──────────────────────────
  const summaryParts: string[] = [];
  if (weather)            summaryParts.push(`${weather.emoji} ${weather.temp}°C · ${weather.label}`);
  if (departuresTo[0])    summaryParts.push(`🚌 ${minuteLabel(departuresTo[0].minutes)} → ${stopB}`);
  if (departuresFrom[0])  summaryParts.push(`🚌 ${minuteLabel(departuresFrom[0].minutes)} from ${stopB}`);
  if (electricity)        summaryParts.push(`⚡ ${electricity.priceNow} öre`);

  return (
    <div className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">

      {/* ── Header / toggle row ─────────────────────────────────────────────── */}
      <button
        onClick={toggle}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/60 transition-colors"
      >
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider flex-shrink-0">
            Live Info
          </span>
          {/* Compact summary visible only when collapsed */}
          {collapsed && summaryParts.length > 0 && (
            <span className="text-xs text-gray-500 dark:text-gray-400 truncate">
              · {summaryParts.join("  ·  ")}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0 ml-2">
          {!collapsed && (
            <Link
              href="/settings"
              onClick={(e) => e.stopPropagation()}
              className="text-xs text-blue-500 flex items-center gap-0.5 hover:underline"
            >
              Configure <ChevronRight size={11} />
            </Link>
          )}
          {collapsed
            ? <ChevronDown size={15} className="text-gray-400" />
            : <ChevronDown size={15} className="text-gray-400 rotate-180 transition-transform" />
          }
        </div>
      </button>

      {/* ── Expanded detail rows ────────────────────────────────────────────── */}
      {!collapsed && (
        <div className="divide-y divide-gray-50 dark:divide-gray-800 border-t border-gray-50 dark:border-gray-800">

          {/* Weather */}
          {weather && (
            <div className="flex items-center gap-3 px-4 py-3">
              <div className="w-9 h-9 rounded-xl bg-sky-50 dark:bg-sky-900/30 flex items-center justify-center flex-shrink-0">
                <Cloud size={16} className="text-sky-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                  {weather.emoji} {weather.temp}°C · {weather.label}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  Feels like {weather.feelsLike}°C · Wind {weather.windSpeed} km/h
                  {weather.location ? ` · ${weather.location}` : ""}
                </p>
              </div>
            </div>
          )}

          {/* Bus to destination */}
          {departuresTo.length > 0 && stopB && (
            <div className="flex items-start gap-3 px-4 py-3">
              <div className="w-9 h-9 rounded-xl bg-violet-50 dark:bg-violet-900/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Bus size={16} className="text-violet-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
                  → {stopB}
                </p>
                <div className="flex gap-2 flex-wrap">
                  {departuresTo.slice(0, 4).map((d, i) => (
                    <span
                      key={i}
                      className={cn(
                        "px-2.5 py-1 rounded-full text-xs font-semibold",
                        i === 0
                          ? "bg-violet-500 text-white"
                          : "bg-violet-50 dark:bg-violet-900/30 text-violet-600 dark:text-violet-300",
                      )}
                    >
                      {minuteLabel(d.minutes)}
                    </span>
                  ))}
                </div>
                {departuresTo[0] && (
                  <p className="text-xs text-gray-400 mt-1">{departuresTo[0].line}</p>
                )}
              </div>
            </div>
          )}

          {/* Bus from destination */}
          {departuresFrom.length > 0 && stopB && (
            <div className="flex items-start gap-3 px-4 py-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Bus size={16} className="text-indigo-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
                  ← from {stopB}
                </p>
                <div className="flex gap-2 flex-wrap">
                  {departuresFrom.slice(0, 4).map((d, i) => (
                    <span
                      key={i}
                      className={cn(
                        "px-2.5 py-1 rounded-full text-xs font-semibold",
                        i === 0
                          ? "bg-indigo-500 text-white"
                          : "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-300",
                      )}
                    >
                      {minuteLabel(d.minutes)}
                    </span>
                  ))}
                </div>
                {departuresFrom[0] && (
                  <p className="text-xs text-gray-400 mt-1">{departuresFrom[0].line}</p>
                )}
              </div>
            </div>
          )}

          {/* Electricity price */}
          {electricity && (
            <div className="flex items-center gap-3 px-4 py-3">
              <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-900/30 flex items-center justify-center flex-shrink-0">
                <Zap size={16} className="text-amber-500" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                    {electricity.priceNow} öre/kWh
                  </p>
                  <span
                    className={cn(
                      "px-2 py-0.5 rounded-full text-xs font-medium flex items-center gap-1",
                      ELEC_LEVEL[electricity.level].bg,
                      ELEC_LEVEL[electricity.level].color,
                    )}
                  >
                    <span className={cn("w-1.5 h-1.5 rounded-full", ELEC_LEVEL[electricity.level].dot)} />
                    {ELEC_LEVEL[electricity.level].label}
                  </span>
                </div>
                <p className="text-xs text-gray-400 mt-0.5">
                  Today {electricity.priceMin}–{electricity.priceMax} öre · Zone {electricity.zone}
                </p>
              </div>
            </div>
          )}

          {/* CTA if bus not configured */}
          {!hasBus && settings.commuteStopA === "" && (
            <div className="px-4 py-3">
              <p className="text-xs text-gray-400">
                🚌 Add your commute stops in{" "}
                <Link href="/settings" className="text-blue-500 hover:underline">
                  Settings
                </Link>{" "}
                to see bus timings.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
