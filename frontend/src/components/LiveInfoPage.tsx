"use client";
import { useEffect } from "react";
import { X, Wind, Thermometer, Bus, Zap, Sun, Sunrise, Sunset, Calendar, MapPin, ChevronRight, Train } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useLiveInfo } from "@/hooks/useLiveInfo";
import { formatEventTime } from "@/lib/calendar";
import { useLandscape } from "@/hooks/useLandscape";

interface Props {
  onClose: () => void;
}

function minuteLabel(min: number): string {
  return min === 0 ? "Now" : `${min} min`;
}

const ELEC_LEVEL = {
  cheap:     { label: "Cheap",  color: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-900/30", dot: "bg-emerald-400", bar: "bg-emerald-400" },
  normal:    { label: "Normal", color: "text-amber-600",   bg: "bg-amber-50 dark:bg-amber-900/30",     dot: "bg-amber-400",   bar: "bg-amber-400"   },
  expensive: { label: "High",   color: "text-red-600",     bg: "bg-red-50 dark:bg-red-900/30",         dot: "bg-red-400",     bar: "bg-red-400"     },
};

// ── Shared card wrapper ───────────────────────────────────────────────────────
function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden", className)}>
      {children}
    </div>
  );
}

function CardHeader({ icon: Icon, title, color }: { icon: React.ElementType; title: string; color: string }) {
  return (
    <div className="flex items-center gap-2.5 px-4 py-3 border-b border-gray-50 dark:border-gray-800">
      <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center", color)}>
        <Icon size={14} className="text-white" strokeWidth={2} />
      </div>
      <span className="font-semibold text-sm text-gray-800 dark:text-gray-200">{title}</span>
    </div>
  );
}

// ── Electricity bar chart ─────────────────────────────────────────────────────
function ElectricityChart({ hourlyPrices, priceMin, priceMax, currentHour }: {
  hourlyPrices: { hour: number; price: number }[];
  priceMin: number;
  priceMax: number;
  currentHour: number;
}) {
  const range = priceMax - priceMin || 1;
  return (
    <div className="flex items-end gap-0.5 h-16 px-1 pt-2">
      {hourlyPrices.map(({ hour, price }) => {
        const heightPct = Math.max(8, Math.round(((price - priceMin) / range) * 100));
        const isCurrent = hour === currentHour;
        const level = price <= priceMin + range / 3 ? "cheap" : price >= priceMax - range / 3 ? "expensive" : "normal";
        return (
          <div key={hour} className="flex-1 flex flex-col items-center gap-0.5 group" title={`${hour}:00 — ${price} öre`}>
            <div
              className={cn("w-full rounded-t transition-all", isCurrent ? "opacity-100 ring-1 ring-offset-1 ring-current" : "opacity-60 group-hover:opacity-100", ELEC_LEVEL[level].bar)}
              style={{ height: `${heightPct}%` }}
            />
            <span className="text-[8px] text-gray-400 leading-none">{hour % 4 === 0 ? `${hour}` : ""}</span>
          </div>
        );
      })}
    </div>
  );
}

// ── Daylight bar ──────────────────────────────────────────────────────────────
function DaylightBar({ sunrise, sunset }: { sunrise: string; sunset: string }) {
  function toMin(t: string) { const [h, m] = t.split(":").map(Number); return h * 60 + m; }
  const total = 24 * 60;
  const rPct  = (toMin(sunrise) / total) * 100;
  const sPct  = (toMin(sunset)  / total) * 100;
  const nowPct = ((new Date().getHours() * 60 + new Date().getMinutes()) / total) * 100;
  return (
    <div className="relative h-4 rounded-full bg-indigo-950 dark:bg-gray-800 overflow-hidden mx-1 mt-2">
      <div className="absolute top-0 h-full bg-gradient-to-r from-amber-300 via-amber-200 to-amber-300 rounded-full" style={{ left: `${rPct}%`, width: `${sPct - rPct}%` }} />
      <div className="absolute top-0 h-full w-0.5 bg-white/80 rounded-full" style={{ left: `${nowPct}%` }} />
    </div>
  );
}

// ── Main modal ────────────────────────────────────────────────────────────────
export function LiveInfoPage({ onClose }: Props) {
  const landscape = useLandscape();
  const { weather, routeDepartures, electricity, calendarEvents } = useLiveInfo();
  const currentHour = new Date().getHours();

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") onClose(); }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  // ── Content blocks (shared between portrait and landscape) ────────────────

  const weatherBlock = weather ? (
    <Card>
      <CardHeader icon={Sun} title="Weather" color="bg-sky-500" />
      <div className="px-4 py-4 space-y-4">
        {/* Current conditions */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-5xl font-bold text-gray-900 dark:text-gray-100">{weather.temp}°</span>
              <span className="text-2xl">{weather.emoji}</span>
            </div>
            <p className="text-base text-gray-500 dark:text-gray-400 mt-1">{weather.label}</p>
            <p className="text-sm text-gray-400 dark:text-gray-500">{weather.location}</p>
          </div>
          <div className="text-right space-y-1.5">
            <div className="flex items-center gap-1.5 justify-end text-sm text-gray-500 dark:text-gray-400">
              <Thermometer size={13} className="text-orange-400" /> Feels like {weather.feelsLike}°C
            </div>
            <div className="flex items-center gap-1.5 justify-end text-sm text-gray-500 dark:text-gray-400">
              <Wind size={13} className="text-blue-400" /> {weather.windSpeed} km/h
            </div>
            {weather.daylight > 0 && (
              <div className="flex items-center gap-1.5 justify-end text-sm text-gray-500 dark:text-gray-400">
                <Sun size={13} className="text-amber-400" /> {weather.daylight}h daylight
              </div>
            )}
          </div>
        </div>

        {/* Hourly forecast strip */}
        {weather.hourly.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">
              Next {weather.hourly.length} hours
            </p>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {weather.hourly.map((h, i) => (
                <div
                  key={h.hour}
                  className={cn(
                    "flex flex-col items-center gap-1 flex-shrink-0 rounded-xl px-3 py-2.5 min-w-[52px]",
                    i === 0 ? "bg-sky-500 text-white" : "bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300",
                  )}
                >
                  <span className="text-[10px] font-medium opacity-70">{i === 0 ? "Now" : `${h.hour}:00`}</span>
                  <span className="text-base leading-none">{h.emoji}</span>
                  <span className="text-sm font-semibold">{h.temp}°</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Sunrise / sunset */}
        {weather.sunrise !== "–" && weather.sunset !== "–" && (
          <div>
            <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1 px-1">
              <span className="flex items-center gap-1"><Sunrise size={11} className="text-amber-400" /> {weather.sunrise}</span>
              <span className="flex items-center gap-1"><Sunset size={11} className="text-orange-400" /> {weather.sunset}</span>
            </div>
            <DaylightBar sunrise={weather.sunrise} sunset={weather.sunset} />
          </div>
        )}
      </div>
    </Card>
  ) : null;

  const transitBlock = (
    <Card>
      <CardHeader icon={Bus} title="Transit" color="bg-violet-500" />
      <div className="divide-y divide-gray-50 dark:divide-gray-800">
        {routeDepartures.length > 0 ? routeDepartures.map((rd) => {
          // Detect bus vs train from line name
          const isTrain = rd.lineName.toLowerCase().includes("tåg") || rd.lineName.toLowerCase().includes("train") || rd.lineName.toLowerCase().includes("pendel");
          const RouteIcon = isTrain ? Train : Bus;
          return (
            <div key={rd.route.id} className="px-4 py-3">
              {/* Route header */}
              <div className="flex items-center gap-1.5 mb-2">
                <RouteIcon size={11} className="text-violet-400 flex-shrink-0" />
                <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 truncate">
                  {rd.route.fromStop} → {rd.route.toStop}
                </span>
              </div>
              {/* Line name + departure pills */}
              {rd.minutes.length > 0 ? (
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[11px] text-gray-400 dark:text-gray-500 mr-1">{rd.lineName}:</span>
                  {rd.minutes.map((min, i) => (
                    <span
                      key={i}
                      className={cn(
                        "px-2 py-0.5 rounded-full text-xs font-semibold flex-shrink-0",
                        i === 0
                          ? "bg-violet-500 text-white"
                          : "bg-violet-50 dark:bg-violet-900/30 text-violet-600 dark:text-violet-300",
                      )}
                    >
                      {minuteLabel(min)}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-gray-400 dark:text-gray-500">No departures found</p>
              )}
            </div>
          );
        }) : (
          <div className="px-4 py-5 text-center">
            <p className="text-sm text-gray-400 dark:text-gray-500 mb-2">No transit routes configured</p>
            <Link href="/settings" onClick={onClose} className="text-xs text-blue-500 flex items-center gap-0.5 justify-center hover:underline">
              Add routes in Settings <ChevronRight size={11} />
            </Link>
          </div>
        )}
      </div>
    </Card>
  );

  const calendarBlock = (
    <Card>
      <CardHeader icon={Calendar} title="Calendar" color="bg-rose-500" />
      <div className="divide-y divide-gray-50 dark:divide-gray-800">
        {calendarEvents.length > 0 ? calendarEvents.map((event) => (
          <div key={event.id} className="px-4 py-3">
            <p className="text-sm font-medium text-gray-800 dark:text-gray-200 leading-snug">{event.title}</p>
            <p className="text-xs text-blue-500 mt-0.5">{formatEventTime(event)}</p>
            {event.location && (
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 flex items-center gap-1 truncate">
                <MapPin size={10} className="flex-shrink-0" /> {event.location}
              </p>
            )}
          </div>
        )) : (
          <div className="px-4 py-5 text-center">
            <p className="text-sm text-gray-400 dark:text-gray-500 mb-2">No upcoming events</p>
            <Link href="/settings" onClick={onClose} className="text-xs text-blue-500 flex items-center gap-0.5 justify-center hover:underline">
              Connect Google Calendar <ChevronRight size={11} />
            </Link>
          </div>
        )}
      </div>
    </Card>
  );

  const electricityBlock = electricity ? (
    <Card>
      <CardHeader icon={Zap} title="Electricity Price" color="bg-amber-500" />
      <div className="px-4 py-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-bold text-gray-900 dark:text-gray-100">{electricity.priceNow}</span>
              <span className="text-sm text-gray-500 dark:text-gray-400">öre/kWh</span>
            </div>
            <p className="text-xs text-gray-400 mt-0.5">Zone {electricity.zone}</p>
          </div>
          <div className="text-right space-y-1">
            <span className={cn("inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold", ELEC_LEVEL[electricity.level].bg, ELEC_LEVEL[electricity.level].color)}>
              <span className={cn("w-2 h-2 rounded-full", ELEC_LEVEL[electricity.level].dot)} />
              {ELEC_LEVEL[electricity.level].label}
            </span>
            <p className="text-xs text-gray-400 dark:text-gray-500">Today: {electricity.priceMin}–{electricity.priceMax} öre</p>
          </div>
        </div>
        <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">24-hour price chart</p>
        <ElectricityChart hourlyPrices={electricity.hourlyPrices} priceMin={electricity.priceMin} priceMax={electricity.priceMax} currentHour={currentHour} />
      </div>
    </Card>
  ) : null;

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-gray-50 dark:bg-gray-950">

      {/* Top bar */}
      <div className="flex items-center justify-between px-5 py-4 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 flex-shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-blue-500 flex items-center justify-center">
            <Sun size={14} className="text-white" strokeWidth={2} />
          </div>
          <h1 className="text-lg font-bold text-gray-900 dark:text-gray-100">Live Info</h1>
        </div>
        <button
          onClick={onClose}
          className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
        >
          <X size={16} className="text-gray-500 dark:text-gray-400" />
        </button>
      </div>

      {landscape ? (
        // ── Landscape: weather left, transit+calendar+electricity right ──────
        <div className="flex-1 flex overflow-hidden">
          <div className="w-[52%] overflow-y-auto p-4 space-y-4 border-r border-gray-100 dark:border-gray-800">
            {weatherBlock}
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {transitBlock}
            {calendarBlock}
            {electricityBlock}
            <div className="h-2" />
          </div>
        </div>
      ) : (
        // ── Portrait: single column, scrollable ────────────────────────────
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-3xl mx-auto px-4 py-5 space-y-4">
            {weatherBlock}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {transitBlock}
              {calendarBlock}
            </div>
            {electricityBlock}
            <div className="h-4" />
          </div>
        </div>
      )}

    </div>
  );
}
