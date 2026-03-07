"use client";
import { Loader2, ChevronRight } from "lucide-react";
import { useLiveInfo } from "@/hooks/useLiveInfo";
import { useSettings } from "@/contexts/SettingsContext";

function minuteLabel(min: number): string {
  return min === 0 ? "Now" : `${min} min`;
}

interface Props {
  onOpen: () => void;
}

export function LiveInfoBar({ onOpen }: Props) {
  const { settings } = useSettings();
  const { weather, departuresTo, departuresFrom, electricity, loading } = useLiveInfo();

  const stopB = settings.commuteStopB;

  // Don't render if nothing to show (and not loading)
  if (!loading && !weather && departuresTo.length === 0 && !electricity) return null;

  // Build compact summary parts
  const parts: string[] = [];
  if (weather)              parts.push(`${weather.emoji} ${weather.temp}°C · ${weather.label}`);
  if (departuresTo[0] && stopB)   parts.push(`🚌 ${minuteLabel(departuresTo[0].minutes)} → ${stopB}`);
  if (departuresFrom[0] && stopB) parts.push(`🚌 ${minuteLabel(departuresFrom[0].minutes)} ← ${stopB}`);
  if (electricity)          parts.push(`⚡ ${electricity.priceNow} öre`);

  return (
    <button
      onClick={onOpen}
      className="w-full flex items-center gap-3 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/60 active:scale-[0.99] transition-all text-left"
    >
      {/* Label or spinner */}
      {loading ? (
        <Loader2 size={12} className="animate-spin text-gray-300 dark:text-gray-600 flex-shrink-0" />
      ) : (
        <span className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider flex-shrink-0">
          Live
        </span>
      )}

      {/* Summary text — scrolls horizontally if too long */}
      <span className="flex-1 text-xs text-gray-500 dark:text-gray-400 truncate min-w-0">
        {loading ? "Loading live info…" : parts.join("  ·  ")}
      </span>

      {/* Expand arrow */}
      <ChevronRight size={13} className="text-gray-300 dark:text-gray-600 flex-shrink-0" />
    </button>
  );
}
