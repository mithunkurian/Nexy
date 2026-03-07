"use client";
import { useEffect } from "react";
import { X, Cloud, Bus, Zap, Settings } from "lucide-react";
import { useLiveInfo } from "@/hooks/useLiveInfo";
import { useSettings } from "@/contexts/SettingsContext";
import { cn } from "@/lib/utils";
import Link from "next/link";

function minuteLabel(min: number): string {
  return min === 0 ? "Now" : `${min} min`;
}

const ELEC_LEVEL = {
  cheap:     { label: "Cheap now",  color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-900/30", dot: "bg-emerald-400" },
  normal:    { label: "Normal",     color: "text-amber-600 dark:text-amber-400",     bg: "bg-amber-50 dark:bg-amber-900/30",     dot: "bg-amber-400" },
  expensive: { label: "High price", color: "text-red-600 dark:text-red-400",         bg: "bg-red-50 dark:bg-red-900/30",         dot: "bg-red-400" },
};

interface Props {
  open: boolean;
  onClose: () => void;
}

export function LiveInfoModal({ open, onClose }: Props) {
  const { settings } = useSettings();
  const { weather, departuresTo, departuresFrom, electricity } = useLiveInfo();

  const stopB  = settings.commuteStopB;
  const hasBus = departuresTo.length > 0 || departuresFrom.length > 0;

  // Close on Escape key
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    /* Backdrop — tap outside to close */
    <div
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-4"
      onClick={onClose}
    >
      {/* Sheet — stops propagation so tapping inside doesn't close */}
      <div
        className="w-full max-w-lg bg-white dark:bg-gray-900 rounded-2xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800">
          <div>
            <h2 className="font-semibold text-gray-900 dark:text-gray-100">Live Info</h2>
            <p className="text-xs text-gray-400 mt-0.5">Updates every 2 minutes</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            <X size={15} className="text-gray-500" />
          </button>
        </div>

        {/* Content rows */}
        <div className="divide-y divide-gray-50 dark:divide-gray-800">

          {/* Weather */}
          {weather && (
            <div className="flex items-center gap-3 px-5 py-4">
              <div className="w-10 h-10 rounded-xl bg-sky-50 dark:bg-sky-900/30 flex items-center justify-center flex-shrink-0">
                <Cloud size={18} className="text-sky-500" />
              </div>
              <div>
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
            <div className="flex items-start gap-3 px-5 py-4">
              <div className="w-10 h-10 rounded-xl bg-violet-50 dark:bg-violet-900/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Bus size={18} className="text-violet-500" />
              </div>
              <div className="flex-1">
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                  → {stopB}
                </p>
                <div className="flex gap-2 flex-wrap">
                  {departuresTo.slice(0, 4).map((d, i) => (
                    <span
                      key={i}
                      className={cn(
                        "px-3 py-1.5 rounded-full text-sm font-semibold",
                        i === 0
                          ? "bg-violet-500 text-white"
                          : "bg-violet-50 dark:bg-violet-900/30 text-violet-600 dark:text-violet-300"
                      )}
                    >
                      {minuteLabel(d.minutes)}
                    </span>
                  ))}
                </div>
                {departuresTo[0] && (
                  <p className="text-xs text-gray-400 mt-1.5">{departuresTo[0].line}</p>
                )}
              </div>
            </div>
          )}

          {/* Bus from destination */}
          {departuresFrom.length > 0 && stopB && (
            <div className="flex items-start gap-3 px-5 py-4">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Bus size={18} className="text-indigo-500" />
              </div>
              <div className="flex-1">
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                  ← from {stopB}
                </p>
                <div className="flex gap-2 flex-wrap">
                  {departuresFrom.slice(0, 4).map((d, i) => (
                    <span
                      key={i}
                      className={cn(
                        "px-3 py-1.5 rounded-full text-sm font-semibold",
                        i === 0
                          ? "bg-indigo-500 text-white"
                          : "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-300"
                      )}
                    >
                      {minuteLabel(d.minutes)}
                    </span>
                  ))}
                </div>
                {departuresFrom[0] && (
                  <p className="text-xs text-gray-400 mt-1.5">{departuresFrom[0].line}</p>
                )}
              </div>
            </div>
          )}

          {/* Electricity price */}
          {electricity && (
            <div className="flex items-center gap-3 px-5 py-4">
              <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-900/30 flex items-center justify-center flex-shrink-0">
                <Zap size={18} className="text-amber-500" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                    {electricity.priceNow} öre/kWh
                  </p>
                  <span className={cn(
                    "px-2 py-0.5 rounded-full text-xs font-medium flex items-center gap-1",
                    ELEC_LEVEL[electricity.level].bg,
                    ELEC_LEVEL[electricity.level].color,
                  )}>
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

          {/* Prompt to configure bus if not set up */}
          {!hasBus && settings.commuteStopA === "" && (
            <div className="px-5 py-4">
              <p className="text-sm text-gray-400">
                🚌 Add your commute stops in{" "}
                <Link href="/settings" onClick={onClose} className="text-blue-500 hover:underline">
                  Settings
                </Link>{" "}
                to see bus timings.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-800 flex justify-end">
          <Link
            href="/settings"
            onClick={onClose}
            className="text-xs text-blue-500 flex items-center gap-1 hover:underline"
          >
            <Settings size={11} />
            Configure
          </Link>
        </div>
      </div>
    </div>
  );
}
