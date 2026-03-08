"use client";
import { useDevices } from "@/hooks/useDevices";
import { DeviceCard } from "@/components/devices/DeviceCard";
import { Badge } from "@/components/ui/Badge";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import type { Device, DeviceType } from "@/types";
import { useLandscape } from "@/hooks/useLandscape";

const TYPE_FILTERS: { label: string; value: DeviceType | "all" }[] = [
  { label: "All", value: "all" },
  { label: "Lights", value: "light" },
  { label: "Blinds", value: "blind" },
  { label: "Plugs", value: "plug" },
  { label: "Sensors", value: "sensor" },
];

export default function DevicesClient() {
  const landscape = useLandscape();
  const { devices, loading, refresh } = useDevices();
  const [filter, setFilter] = useState<DeviceType | "all">("all");

  const filtered =
    filter === "all" ? devices : devices.filter((d) => d.type === filter);

  const onUpdate = (updated: Device) => refresh();

  return (
    <div className={landscape
      ? "h-full flex flex-col px-4 py-3 overflow-hidden"
      : "max-w-2xl mx-auto px-4 py-6 space-y-5"
    }>
      <div className="flex-shrink-0">
        <h1 className={landscape ? "text-xl font-bold text-gray-900 dark:text-gray-100" : "text-2xl font-bold text-gray-900 dark:text-gray-100"}>
          All Devices
        </h1>
        <p className="text-sm text-gray-400">
          {devices.length} device{devices.length !== 1 ? "s" : ""} total
        </p>
      </div>

      {/* Filter chips */}
      <div className="flex flex-wrap gap-2 flex-shrink-0">
        {TYPE_FILTERS.map(({ label, value }) => (
          <button
            key={value}
            onClick={() => setFilter(value)}
            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
              filter === value
                ? "bg-nexy-500 text-white"
                : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="animate-spin text-gray-400" size={28} />
        </div>
      ) : filtered.length === 0 ? (
        <p className="text-center py-12 text-gray-400 text-sm">No devices found.</p>
      ) : (
        <div className={`${landscape ? "flex-1 min-h-0 overflow-y-auto" : ""}`}>
          <div className={`grid gap-3 ${landscape ? "grid-cols-4 lg:grid-cols-5" : "grid-cols-2 sm:grid-cols-3"}`}>
            {filtered.map((d) => (
              <DeviceCard key={d.id} device={d} onUpdate={onUpdate} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
