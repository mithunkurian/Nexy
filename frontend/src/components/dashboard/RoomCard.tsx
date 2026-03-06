"use client";
import { cn } from "@/lib/utils";
import {
  Sofa, BedDouble, UtensilsCrossed, Bath, Briefcase,
  Car, Trees, Box, Lightbulb
} from "lucide-react";
import type { Device, Room } from "@/types";
import Link from "next/link";

const ROOM_ICONS: Record<string, React.ElementType> = {
  living:   Sofa,
  lounge:   Sofa,
  bedroom:  BedDouble,
  kitchen:  UtensilsCrossed,
  bathroom: Bath,
  bath:     Bath,
  office:   Briefcase,
  garage:   Car,
  garden:   Trees,
  outdoor:  Trees,
};

function getRoomIcon(name: string): React.ElementType {
  const lower = name.toLowerCase();
  for (const [key, Icon] of Object.entries(ROOM_ICONS)) {
    if (lower.includes(key)) return Icon;
  }
  return Box;
}

// Visual dot indicators (up to 6 device dots)
function DeviceDots({ devices }: { devices: Device[] }) {
  const shown = devices.slice(0, 6);
  return (
    <div className="flex gap-1 flex-wrap mt-2">
      {shown.map((d) => (
        <span
          key={d.id}
          title={d.name}
          className={cn(
            "w-2 h-2 rounded-full",
            d.state.is_on
              ? "bg-nexy-400"
              : "bg-gray-200",
          )}
        />
      ))}
      {devices.length > 6 && (
        <span className="text-[10px] text-gray-400">+{devices.length - 6}</span>
      )}
    </div>
  );
}

interface RoomCardProps {
  room: Room;
  devices: Device[];
}

export function RoomCard({ room, devices }: RoomCardProps) {
  const onCount  = devices.filter((d) => d.state.is_on).length;
  const hasActive = onCount > 0;
  const Icon = getRoomIcon(room.name);

  return (
    <Link href="/devices" className="block">
      <div
        className={cn(
          "rounded-2xl p-4 border transition-all duration-200 cursor-pointer select-none",
          hasActive
            ? "bg-white border-nexy-100 shadow-sm shadow-nexy-50"
            : "bg-white border-gray-100",
          "hover:shadow-md hover:border-nexy-200",
        )}
      >
        {/* Icon + name */}
        <div className="flex items-center justify-between mb-3">
          <div
            className={cn(
              "w-9 h-9 rounded-xl flex items-center justify-center",
              hasActive ? "bg-nexy-100 text-nexy-600" : "bg-gray-100 text-gray-400",
            )}
          >
            <Icon size={17} strokeWidth={1.8} />
          </div>
          {hasActive && (
            <span className="text-xs font-medium text-nexy-500 bg-nexy-50 px-2 py-0.5 rounded-full">
              {onCount} on
            </span>
          )}
        </div>

        {/* Room name */}
        <p className="font-semibold text-sm text-gray-800 truncate">{room.name}</p>
        <p className="text-xs text-gray-400 mt-0.5">
          {devices.length} device{devices.length !== 1 ? "s" : ""}
        </p>

        {/* Device dots */}
        <DeviceDots devices={devices} />
      </div>
    </Link>
  );
}
