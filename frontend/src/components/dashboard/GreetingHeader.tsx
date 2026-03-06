"use client";
import { useEffect, useState } from "react";
import { Cloud, Sun, Sunset, Moon, CloudMoon } from "lucide-react";

type Period = "morning" | "afternoon" | "evening" | "night";

function getPeriod(): Period {
  const h = new Date().getHours();
  if (h >= 5 && h < 12) return "morning";
  if (h >= 12 && h < 17) return "afternoon";
  if (h >= 17 && h < 21) return "evening";
  return "night";
}

const GREETINGS: Record<Period, { text: string; sub: string }> = {
  morning:   { text: "Good morning",   sub: "Here's your home overview" },
  afternoon: { text: "Good afternoon", sub: "Here's what's happening at home" },
  evening:   { text: "Good evening",   sub: "Here's your home status" },
  night:     { text: "Good night",     sub: "Everything looks quiet at home" },
};

const PERIOD_ICONS: Record<Period, React.ElementType> = {
  morning:   Sun,
  afternoon: Cloud,
  evening:   Sunset,
  night:     Moon,
};

export function GreetingHeader() {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const t = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(t);
  }, []);

  if (!now) return <div className="h-28 bg-white rounded-2xl border border-gray-100 animate-pulse" />;

  const period = getPeriod();
  const { text, sub } = GREETINGS[period];
  const Icon = PERIOD_ICONS[period];

  const dateStr = now.toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="relative overflow-hidden rounded-2xl bg-white border border-gray-100 shadow-sm px-5 py-5">
      {/* Soft background blobs */}
      <div className="pointer-events-none absolute -top-8 -right-8 w-36 h-36 rounded-full bg-blue-50 opacity-60" />
      <div className="pointer-events-none absolute -bottom-6 -left-6 w-24 h-24 rounded-full bg-indigo-50 opacity-40" />

      <div className="relative flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-medium text-nexy-500 uppercase tracking-widest mb-1">
            {dateStr}
          </p>
          <h1 className="text-2xl font-bold text-gray-900 leading-tight">{text}</h1>
          <p className="text-sm text-gray-400 mt-0.5">{sub}</p>
        </div>
        <div className="flex-shrink-0 mt-1 w-12 h-12 rounded-xl bg-nexy-50 flex items-center justify-center">
          <Icon size={24} className="text-nexy-500" strokeWidth={1.5} />
        </div>
      </div>
    </div>
  );
}
