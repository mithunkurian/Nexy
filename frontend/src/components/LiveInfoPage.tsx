"use client";
import { useEffect, useState } from "react";
import { X, Wind, Thermometer, Bus, Zap, Sun, Sunrise, Sunset, Calendar, MapPin, ChevronRight, Train } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useLiveInfo } from "@/hooks/useLiveInfo";
import { formatEventTime } from "@/lib/calendar";
import { useLandscape } from "@/hooks/useLandscape";
import type { HourlyForecast } from "@/lib/weather";

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

// ── Temperature curve chart ───────────────────────────────────────────────────
function TempCurveChart({ hourly }: { hourly: HourlyForecast[] }) {
  const [hovered, setHovered] = useState<number | null>(null);
  if (hourly.length < 2) return null;

  const W         = 620;
  const PAD_LEFT  = 38;  // Y-axis label column
  const PAD_RIGHT = 10;
  const PAD_T     = 88;  // room for emoji row + floating temp labels
  const CH        = 96;  // curve drawing area
  const PAD_B     = 34;  // hour labels
  const TOTAL     = PAD_T + CH + PAD_B;  // 218
  const EMOJI_Y   = 26;
  const TEMP_Y_MIN = PAD_T - 16;

  const temps = hourly.map((h) => h.temp);
  const minT  = Math.min(...temps);
  const maxT  = Math.max(...temps);
  const range = maxT - minT || 1;
  const n     = hourly.length;
  const chartW = W - PAD_LEFT - PAD_RIGHT;
  const stepX  = chartW / (n - 1);

  const toY = (t: number) => PAD_T + CH - ((t - minT) / range) * (CH - 20) - 10;

  const pts = hourly.map((h, i) => ({
    x: PAD_LEFT + i * stepX,
    y: toY(h.temp),
    temp: h.temp,
    hour: h.hour,
    emoji: h.emoji,
  }));

  let linePath = `M ${pts[0].x} ${pts[0].y}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const cx = (pts[i + 1].x - pts[i].x) * 0.45;
    linePath += ` C ${pts[i].x + cx} ${pts[i].y} ${pts[i + 1].x - cx} ${pts[i + 1].y} ${pts[i + 1].x} ${pts[i + 1].y}`;
  }
  const fillPath = linePath + ` L ${pts[n - 1].x} ${TOTAL - PAD_B + 2} L ${pts[0].x} ${TOTAL - PAD_B + 2} Z`;

  // Y-axis gridline temperatures: max, mid, min (deduplicated)
  const gridTemps = [...new Set([maxT, Math.round((maxT + minT) / 2), minT])];

  // Tooltip geometry
  const TW = 76; const TH = 96;
  const hp  = hovered !== null ? pts[hovered] : null;
  const ttX = hp ? Math.max(PAD_LEFT, Math.min(W - PAD_RIGHT - TW, hp.x - TW / 2)) : 0;
  const ttY = hp ? Math.max(2, hp.y - TH - 18) : 0;

  return (
    // aspect-ratio wrapper: chart fills full card width, height scales naturally
    <div style={{ aspectRatio: `${W} / ${TOTAL}` }} className="w-full">
      <svg viewBox={`0 0 ${W} ${TOTAL}`} width="100%" height="100%" aria-hidden>
        <defs>
          <linearGradient id="tcGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#38bdf8" stopOpacity="0" />
          </linearGradient>
          <filter id="ttShadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="2" stdDeviation="4" floodColor="black" floodOpacity="0.12" />
          </filter>
        </defs>

        {/* ── Y-axis gridlines + labels ── */}
        {gridTemps.map((t) => {
          const gy = toY(t);
          return (
            <g key={t}>
              {/* Gridline spans full width from just after label to right edge */}
              <line
                x1={PAD_LEFT} y1={gy} x2={W - PAD_RIGHT} y2={gy}
                className="stroke-gray-100 dark:stroke-gray-700"
                strokeWidth="1" strokeDasharray="3 5"
              />
              {/* Y-axis label — right-aligned before the chart area */}
              <text
                x={PAD_LEFT - 5} y={gy + 4}
                textAnchor="end" fontSize="11"
                className="fill-gray-400 dark:fill-gray-500"
              >
                {t}°
              </text>
            </g>
          );
        })}

        {/* ── Gradient fill + curve ── */}
        <path d={fillPath} fill="url(#tcGrad)" />
        <path d={linePath} fill="none" stroke="#38bdf8" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />

        {/* ── "Now" fixed dashed marker ── */}
        <line
          x1={pts[0].x} y1={EMOJI_Y + 6} x2={pts[0].x} y2={TOTAL - PAD_B}
          stroke="#0ea5e9" strokeWidth="1.5" strokeDasharray="4 3" strokeOpacity="0.45"
        />

        {/* ── Hover: full-height vertical dotted line (behind data points) ── */}
        {hp && (
          <line
            x1={hp.x} y1={4} x2={hp.x} y2={TOTAL - PAD_B}
            stroke="#0ea5e9" strokeWidth="1.5" strokeDasharray="4 3" strokeOpacity="0.55"
            style={{ pointerEvents: "none" }}
          />
        )}

        {/* ── Data points ── */}
        {pts.map((p, i) => {
          const labelY  = Math.max(p.y - 10, TEMP_Y_MIN);
          const hourStr = i === 0 ? "Now" : `${String(p.hour).padStart(2, "0")}:00`;
          const isHov   = hovered === i;
          return (
            <g
              key={i}
              onPointerEnter={() => setHovered(i)}
              onPointerLeave={() => setHovered(null)}
              style={{ cursor: "default" }}
            >
              {/* Hit area */}
              <rect
                x={Math.max(0, p.x - stepX / 2)} y={0}
                width={stepX} height={TOTAL} fill="transparent"
              />
              {/* Emoji */}
              <text x={p.x} y={EMOJI_Y} textAnchor="middle" fontSize="22" className="select-none">
                {p.emoji}
              </text>
              {/* Temperature label */}
              <text
                x={p.x} y={labelY}
                textAnchor="middle" fontSize="16" fontWeight="700"
                className={isHov ? "fill-sky-500" : "fill-gray-800 dark:fill-gray-100"}
              >
                {p.temp}°
              </text>
              {/* Dot */}
              {isHov ? (
                <circle cx={p.x} cy={p.y} r="6" fill="#0ea5e9" />
              ) : i === 0 ? (
                <circle cx={p.x} cy={p.y} r="5" fill="#0ea5e9" />
              ) : (
                <circle cx={p.x} cy={p.y} r="3" fill="#38bdf8" opacity="0.85" />
              )}
              {/* Hour label */}
              <text
                x={p.x} y={TOTAL - 7}
                textAnchor="middle" fontSize="13"
                className={isHov ? "fill-sky-500" : "fill-gray-400 dark:fill-gray-500"}
              >
                {hourStr}
              </text>
            </g>
          );
        })}

        {/* ── Hover tooltip (top layer) ── */}
        {hp !== null && hovered !== null && (
          <g style={{ pointerEvents: "none" }}>
            <rect
              x={ttX} y={ttY} width={TW} height={TH} rx="10"
              className="fill-white dark:fill-gray-800 stroke-gray-200 dark:stroke-gray-700"
              strokeWidth="1" filter="url(#ttShadow)"
            />
            <text x={ttX + TW / 2} y={ttY + 20} textAnchor="middle" fontSize="13" fontWeight="600" className="fill-gray-500 dark:fill-gray-400">
              {hovered === 0 ? "Now" : `${String(hp.hour).padStart(2, "0")}:00`}
            </text>
            <text x={ttX + TW / 2} y={ttY + 54} textAnchor="middle" fontSize="26" className="select-none">
              {hp.emoji}
            </text>
            <text x={ttX + TW / 2} y={ttY + 82} textAnchor="middle" fontSize="22" fontWeight="700" className="fill-gray-900 dark:fill-gray-100">
              {hp.temp}°
            </text>
          </g>
        )}
      </svg>
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

        {/* Temperature curve chart */}
        {weather.hourly.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">
              Next {weather.hourly.length} hours
            </p>
            <TempCurveChart hourly={weather.hourly} />
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
