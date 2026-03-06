"use client";
import { useRouter } from "next/navigation";
import {
  Lightbulb,
  Lock,
  Thermometer,
  Camera,
  Blinds,
  Power,
  Sparkles,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Device } from "@/types";

interface TileConfig {
  id: string;
  label: string;
  icon: React.ElementType;
  color: string;
  bg: string;
  activeBg: string;
  route: string;
  getStatus: (devices: Device[]) => { text: string; active: boolean; count?: number };
}

const TILES: TileConfig[] = [
  {
    id: "lights",
    label: "Lighting",
    icon: Lightbulb,
    color: "text-amber-600",
    bg: "bg-amber-50 dark:bg-amber-950/30",
    activeBg: "bg-amber-100 dark:bg-amber-900/40",
    route: "/devices",
    getStatus: (devices) => {
      const lights = devices.filter((d) => d.type === "light");
      const on = lights.filter((d) => d.state.is_on).length;
      return {
        active: on > 0,
        count: on,
        text: lights.length === 0 ? "No lights" : on > 0 ? `${on} of ${lights.length} on` : "All off",
      };
    },
  },
  {
    id: "security",
    label: "Security",
    icon: Lock,
    color: "text-blue-600",
    bg: "bg-blue-50 dark:bg-blue-950/30",
    activeBg: "bg-blue-100 dark:bg-blue-900/40",
    route: "/devices",
    getStatus: (devices) => {
      const locks = devices.filter((d) => d.type === "lock");
      const unlocked = locks.filter((d) => d.state.is_on).length;
      return {
        active: unlocked > 0,
        count: unlocked,
        text: locks.length === 0 ? "No locks" : unlocked > 0 ? `${unlocked} unlocked` : "All locked",
      };
    },
  },
  {
    id: "climate",
    label: "Climate",
    icon: Thermometer,
    color: "text-emerald-600",
    bg: "bg-emerald-50 dark:bg-emerald-950/30",
    activeBg: "bg-emerald-100 dark:bg-emerald-900/40",
    route: "/devices",
    getStatus: (devices) => {
      const sensors = devices.filter((d) => d.type === "sensor" || d.type === "thermostat");
      const temps = sensors.filter((d) => d.state.temperature != null).map((d) => d.state.temperature!);
      const avg = temps.length > 0 ? (temps.reduce((a, b) => a + b, 0) / temps.length).toFixed(1) : null;
      return {
        active: false,
        text: avg ? `${avg}°C avg` : sensors.length > 0 ? `${sensors.length} sensor${sensors.length > 1 ? "s" : ""}` : "No sensors",
      };
    },
  },
  {
    id: "cameras",
    label: "Cameras",
    icon: Camera,
    color: "text-violet-600",
    bg: "bg-violet-50 dark:bg-violet-950/30",
    activeBg: "bg-violet-100 dark:bg-violet-900/40",
    route: "/devices",
    getStatus: (devices) => {
      const cams = devices.filter((d) => d.type === "unknown" && d.name.toLowerCase().includes("camera"));
      return {
        active: false,
        text: cams.length > 0 ? `${cams.length} camera${cams.length > 1 ? "s" : ""}` : "Not connected",
      };
    },
  },
  {
    id: "blinds",
    label: "Blinds",
    icon: Blinds,
    color: "text-slate-600",
    bg: "bg-slate-50 dark:bg-slate-800/40",
    activeBg: "bg-slate-100 dark:bg-slate-700/40",
    route: "/devices",
    getStatus: (devices) => {
      const blinds = devices.filter((d) => d.type === "blind");
      const open = blinds.filter((d) => (d.state.position ?? 0) > 0).length;
      return {
        active: open > 0,
        count: open,
        text: blinds.length === 0 ? "No blinds" : open > 0 ? `${open} open` : "All closed",
      };
    },
  },
  {
    id: "plugs",
    label: "Plugs",
    icon: Power,
    color: "text-rose-600",
    bg: "bg-rose-50 dark:bg-rose-950/30",
    activeBg: "bg-rose-100 dark:bg-rose-900/40",
    route: "/devices",
    getStatus: (devices) => {
      const plugs = devices.filter((d) => d.type === "plug");
      const on = plugs.filter((d) => d.state.is_on).length;
      return {
        active: on > 0,
        count: on,
        text: plugs.length === 0 ? "No plugs" : on > 0 ? `${on} of ${plugs.length} on` : "All off",
      };
    },
  },
  {
    id: "energy",
    label: "Energy",
    icon: Zap,
    color: "text-yellow-600",
    bg: "bg-yellow-50 dark:bg-yellow-950/30",
    activeBg: "bg-yellow-100 dark:bg-yellow-900/40",
    route: "/devices",
    getStatus: (devices) => {
      const active = devices.filter((d) => d.state.is_on).length;
      return {
        active: active > 0,
        text: `${active} device${active !== 1 ? "s" : ""} active`,
      };
    },
  },
  {
    id: "ai",
    label: "Nexy AI",
    icon: Sparkles,
    color: "text-indigo-600",
    bg: "bg-indigo-50 dark:bg-indigo-950/30",
    activeBg: "bg-indigo-100 dark:bg-indigo-900/40",
    route: "/chat",
    getStatus: () => ({ active: false, text: "Ask anything" }),
  },
];

interface ControlTilesProps {
  devices: Device[];
}

export function ControlTiles({ devices }: ControlTilesProps) {
  const router = useRouter();

  return (
    <section>
      <h2 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3">
        Controls
      </h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {TILES.map((tile) => {
          const { text, active, count } = tile.getStatus(devices);
          const Icon = tile.icon;
          return (
            <button
              key={tile.id}
              onClick={() => router.push(tile.route)}
              className={cn(
                "relative flex flex-col gap-3 rounded-2xl p-4 border text-left transition-all duration-200",
                "hover:shadow-md hover:-translate-y-0.5 active:scale-[0.98]",
                active
                  ? `${tile.activeBg} border-current/10 shadow-sm`
                  : `${tile.bg} border-transparent`
              )}
            >
              {/* Active dot */}
              {active && (
                <span className="absolute top-3 right-3 w-2 h-2 rounded-full bg-current opacity-70 animate-pulse" />
              )}

              {/* Icon */}
              <div
                className={cn(
                  "w-9 h-9 rounded-xl flex items-center justify-center bg-white/60 dark:bg-gray-800/60",
                  tile.color
                )}
              >
                <Icon size={17} strokeWidth={1.8} />
              </div>

              {/* Text */}
              <div>
                <p className="font-semibold text-sm text-gray-800 dark:text-gray-200 leading-tight">
                  {tile.label}
                </p>
                <p className={cn("text-xs mt-0.5 leading-snug", active ? tile.color : "text-gray-400 dark:text-gray-500")}>
                  {text}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
