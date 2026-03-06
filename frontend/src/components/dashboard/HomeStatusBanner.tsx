"use client";
import { ShieldCheck, ShieldAlert, Lock, Unlock, Wifi, WifiOff } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Device } from "@/types";

interface HomeStatusBannerProps {
  devices: Device[];
}

export function HomeStatusBanner({ devices }: HomeStatusBannerProps) {
  const locks     = devices.filter((d) => d.type === "lock");
  const allLocked = locks.length > 0 && locks.every((d) => d.state.is_on === false);
  const anyUnlocked = locks.some((d) => d.state.is_on === true);

  const offline   = devices.filter((d) => !d.reachable);
  const hasIssue  = anyUnlocked || offline.length > 0;

  // Status line
  const statusItems: string[] = [];
  if (locks.length > 0) {
    statusItems.push(anyUnlocked ? `${locks.filter((l) => l.state.is_on).length} door(s) unlocked` : "All doors locked");
  }
  if (offline.length > 0) {
    statusItems.push(`${offline.length} device${offline.length > 1 ? "s" : ""} offline`);
  }
  if (statusItems.length === 0) {
    statusItems.push("All systems normal");
  }

  const safe = !hasIssue;

  return (
    <div
      className={cn(
        "flex items-center gap-4 rounded-2xl px-5 py-4 border transition-all",
        safe
          ? "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-100 dark:border-emerald-900"
          : "bg-amber-50 dark:bg-amber-950/30 border-amber-100 dark:border-amber-900"
      )}
    >
      {/* Shield icon */}
      <div
        className={cn(
          "flex-shrink-0 w-11 h-11 rounded-xl flex items-center justify-center",
          safe ? "bg-emerald-100 dark:bg-emerald-900/50" : "bg-amber-100 dark:bg-amber-900/50"
        )}
      >
        {safe ? (
          <ShieldCheck size={22} className="text-emerald-600 dark:text-emerald-400" strokeWidth={1.8} />
        ) : (
          <ShieldAlert size={22} className="text-amber-600 dark:text-amber-400" strokeWidth={1.8} />
        )}
      </div>

      {/* Text */}
      <div className="flex-1 min-w-0">
        <p className={cn("font-semibold text-sm", safe ? "text-emerald-800 dark:text-emerald-300" : "text-amber-800 dark:text-amber-300")}>
          {safe ? "Your home is safe" : "Attention needed"}
        </p>
        <p className={cn("text-xs mt-0.5 truncate", safe ? "text-emerald-600 dark:text-emerald-500" : "text-amber-600 dark:text-amber-500")}>
          {statusItems.join(" · ")}
        </p>
      </div>

      {/* Indicators */}
      <div className="flex-shrink-0 flex flex-col items-end gap-1">
        <div className="flex items-center gap-1">
          {locks.length > 0 ? (
            anyUnlocked
              ? <Unlock size={13} className="text-amber-500" />
              : <Lock size={13} className="text-emerald-500" />
          ) : null}
          {offline.length === 0
            ? <Wifi size={13} className="text-emerald-500" />
            : <WifiOff size={13} className="text-amber-500" />}
        </div>
        <span className={cn("text-[10px] font-medium", safe ? "text-emerald-500" : "text-amber-500")}>
          {devices.length} devices
        </span>
      </div>
    </div>
  );
}
