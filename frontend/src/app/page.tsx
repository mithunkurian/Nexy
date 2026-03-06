"use client";
import { useDevices } from "@/hooks/useDevices";
import { RoomSection } from "@/components/devices/RoomSection";
import { DeviceCard } from "@/components/devices/DeviceCard";
import { Loader2, Wifi, WifiOff } from "lucide-react";
import type { Device } from "@/types";

export default function HomePage() {
  const { devices, rooms, loading, refresh } = useDevices();

  const onDeviceUpdate = (updated: Device) => {
    // Optimistic update handled by useDevices via WS, but we still propagate
    refresh();
  };

  // Group devices by room
  const roomedDeviceIds = new Set(
    rooms.flatMap((r) => r.device_ids ?? [])
  );
  const unroomed = devices.filter(
    (d) => !d.room && !roomedDeviceIds.has(d.id)
  );

  const onCount = devices.filter((d) => d.state.is_on).length;

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Nexy</h1>
          <p className="text-sm text-gray-400">
            {loading
              ? "Loading..."
              : `${devices.length} device${devices.length !== 1 ? "s" : ""} · ${onCount} on`}
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-400">
          {loading ? (
            <Loader2 size={16} className="animate-spin" />
          ) : devices.length > 0 ? (
            <Wifi size={16} className="text-green-500" />
          ) : (
            <WifiOff size={16} className="text-red-400" />
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center py-16 gap-3 text-gray-400">
          <Loader2 size={32} className="animate-spin" />
          <p className="text-sm">Connecting to your home...</p>
        </div>
      ) : devices.length === 0 ? (
        <EmptyState />
      ) : (
        <>
          {/* Rooms */}
          {rooms.map((room) => {
            const roomDevices = devices.filter(
              (d) =>
                d.room === room.name ||
                (room.device_ids ?? []).includes(d.id)
            );
            return (
              <RoomSection
                key={room.id}
                room={room}
                devices={roomDevices}
                onDeviceUpdate={onDeviceUpdate}
              />
            );
          })}

          {/* Unroomed devices */}
          {unroomed.length > 0 && (
            <section>
              <h2 className="text-base font-semibold text-gray-700 mb-3">
                Other Devices
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {unroomed.map((d) => (
                  <DeviceCard key={d.id} device={d} onUpdate={onDeviceUpdate} />
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center py-16 gap-4 text-center">
      <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center text-3xl">
        🏠
      </div>
      <div>
        <p className="font-semibold text-gray-700">No devices found</p>
        <p className="text-sm text-gray-400 mt-1 max-w-xs">
          Make sure your IKEA Dirigera hub is configured in the backend{" "}
          <code className="text-xs bg-gray-100 px-1 rounded">.env</code> file
          and is reachable on your network.
        </p>
      </div>
    </div>
  );
}
