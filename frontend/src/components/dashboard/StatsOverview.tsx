import { Layers, Zap, DoorOpen, WifiOff } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Device, Room } from "@/types";

interface StatsOverviewProps {
  devices: Device[];
  rooms: Room[];
}

export function StatsOverview({ devices, rooms }: StatsOverviewProps) {
  const onCount       = devices.filter((d) => d.state.is_on).length;
  const offlineCount  = devices.filter((d) => !d.reachable).length;

  const stats = [
    {
      label: "Devices",
      value: devices.length,
      icon: Layers,
      color: "text-nexy-600",
      bg: "bg-nexy-50",
    },
    {
      label: "Active",
      value: onCount,
      icon: Zap,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
    },
    {
      label: "Rooms",
      value: rooms.length,
      icon: DoorOpen,
      color: "text-violet-600",
      bg: "bg-violet-50",
    },
    {
      label: "Offline",
      value: offlineCount,
      icon: WifiOff,
      color: offlineCount > 0 ? "text-amber-600" : "text-gray-400",
      bg:    offlineCount > 0 ? "bg-amber-50"  : "bg-gray-50",
    },
  ];

  return (
    <div className="grid grid-cols-4 gap-2.5">
      {stats.map(({ label, value, icon: Icon, color, bg }) => (
        <div
          key={label}
          className="flex flex-col items-center gap-1.5 rounded-2xl bg-white border border-gray-100 shadow-sm py-3 px-2"
        >
          <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center", bg)}>
            <Icon size={15} className={cn(color)} strokeWidth={2} />
          </div>
          <span className="text-lg font-bold text-gray-900 leading-none">{value}</span>
          <span className="text-[10px] font-medium text-gray-400 tracking-wide uppercase">
            {label}
          </span>
        </div>
      ))}
    </div>
  );
}
