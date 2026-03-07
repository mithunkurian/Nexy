"use client";
import { useEffect, useState } from "react";
import { Sun, Cloud, Sunset, Moon, MapPin } from "lucide-react";
import { useSettings } from "@/contexts/SettingsContext";
import { useLiveInfo } from "@/hooks/useLiveInfo";

type Period = "morning" | "afternoon" | "evening" | "night";

function getPeriod(h: number): Period {
  if (h >= 5 && h < 12) return "morning";
  if (h >= 12 && h < 17) return "afternoon";
  if (h >= 17 && h < 21) return "evening";
  return "night";
}

const PERIOD_CONFIG: Record<
  Period,
  { greeting: string; sub: string; icon: React.ElementType; gradient: string }
> = {
  morning:   { greeting: "Good morning",   sub: "Here's your home at a glance",     icon: Sun,    gradient: "from-amber-50 to-orange-50" },
  afternoon: { greeting: "Good afternoon", sub: "Everything looks good today",       icon: Cloud,  gradient: "from-blue-50 to-sky-50" },
  evening:   { greeting: "Good evening",   sub: "Your home is ready for the night", icon: Sunset, gradient: "from-violet-50 to-pink-50" },
  night:     { greeting: "Good night",     sub: "All quiet at home",                icon: Moon,   gradient: "from-indigo-50 to-slate-100" },
};

function minuteLabel(min: number): string {
  if (min === 0) return "Now";
  return `${min} min`;
}

export function GreetingHeader() {
  const { settings } = useSettings();
  const [now, setNow] = useState<Date | null>(null);
  const { weather, departuresTo, departuresFrom } = useLiveInfo();

  useEffect(() => {
    setNow(new Date());
    const t = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(t);
  }, []);

  if (!now) {
    return (
      <div className="h-32 rounded-2xl bg-gray-100 dark:bg-gray-800 animate-pulse" />
    );
  }

  const period = getPeriod(now.getHours());
  const { greeting, sub, icon: Icon, gradient } = PERIOD_CONFIG[period];

  const name = settings.ownerName ? `, ${settings.ownerName}` : "";
  const homeName = settings.homeName || "My Home";
  const address = settings.address;

  const dateStr = now.toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  const nextTo   = departuresTo[0];
  const nextFrom = departuresFrom[0];
  const stopB    = settings.commuteStopB;

  return (
    <div
      className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${gradient} dark:from-gray-800 dark:to-gray-900 border border-white/80 dark:border-gray-700 shadow-sm px-5 py-5`}
    >
      {/* Decorative orbs */}
      <div className="pointer-events-none absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/50 dark:bg-white/5" />
      <div className="pointer-events-none absolute -bottom-8 -left-8 w-28 h-28 rounded-full bg-white/40 dark:bg-white/5" />

      <div className="relative">
        {/* Greeting + icon */}
        <div className="flex items-start justify-between mb-3">
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1">
              {dateStr}
            </p>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 leading-tight">
              {greeting}{name}
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{sub}</p>
          </div>
          <div className="flex-shrink-0 w-11 h-11 rounded-xl bg-white/60 dark:bg-gray-700/60 backdrop-blur-sm flex items-center justify-center shadow-sm border border-white/50 dark:border-gray-600">
            <Icon size={22} className="text-gray-600 dark:text-gray-300" strokeWidth={1.5} />
          </div>
        </div>

        {/* Home name + address chip */}
        <div className="flex items-center gap-1.5 pt-3 border-t border-black/5 dark:border-white/10">
          <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">🏠 {homeName}</span>
          {address && (
            <>
              <span className="text-gray-300 dark:text-gray-600">·</span>
              <MapPin size={11} className="text-gray-400 flex-shrink-0" />
              <span className="text-xs text-gray-400 truncate">{address}</span>
            </>
          )}
        </div>

        {/* Live info strip — weather + bus in one line */}
        {(weather || nextTo || nextFrom) && (
          <div className="flex items-center gap-3 flex-wrap mt-2.5 pt-2.5 border-t border-black/5 dark:border-white/10 text-xs text-gray-600 dark:text-gray-400">
            {/* Weather */}
            {weather && (
              <span className="flex items-center gap-1">
                <span>{weather.emoji}</span>
                <span className="font-semibold text-gray-800 dark:text-gray-200">{weather.temp}°C</span>
                <span className="text-gray-400">· {weather.label}</span>
              </span>
            )}

            {/* Bus to destination */}
            {nextTo && stopB && (
              <>
                {weather && <span className="text-gray-300 dark:text-gray-600 select-none">·</span>}
                <span className="flex items-center gap-1">
                  <span>🚌</span>
                  <span className="font-semibold text-gray-800 dark:text-gray-200">
                    {minuteLabel(nextTo.minutes)}
                  </span>
                  <span className="text-gray-400">→ {stopB}</span>
                </span>
              </>
            )}

            {/* Bus from destination */}
            {nextFrom && stopB && (
              <>
                <span className="text-gray-300 dark:text-gray-600 select-none">·</span>
                <span className="flex items-center gap-1">
                  <span>🚌</span>
                  <span className="font-semibold text-gray-800 dark:text-gray-200">
                    {minuteLabel(nextFrom.minutes)}
                  </span>
                  <span className="text-gray-400">from {stopB}</span>
                </span>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
