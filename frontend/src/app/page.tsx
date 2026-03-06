"use client";
import { useDevices } from "@/hooks/useDevices";
import { GreetingHeader } from "@/components/dashboard/GreetingHeader";
import { StatsOverview } from "@/components/dashboard/StatsOverview";
import { QuickScenes } from "@/components/dashboard/QuickScenes";
import { RoomCard } from "@/components/dashboard/RoomCard";
import { ActiveDevicesStrip } from "@/components/dashboard/ActiveDevicesStrip";
import { AskNexyBar } from "@/components/dashboard/AskNexyBar";
import { Loader2 } from "lucide-react";
import type { Device } from "@/types";

export default function HomePage() {
  const { devices, rooms, loading, refresh } = useDevices();

  const onDeviceUpdate = (_: Device) => refresh();

  // Map devices to rooms
  function devicesForRoom(room: { id: string; name: string; device_ids?: string[] }): Device[] {
    return devices.filter(
      (d) => d.room === room.name || (room.device_ids ?? []).includes(d.id),
    );
  }

  // Devices not in any room
  const roomedIds = new Set(rooms.flatMap((r) => r.device_ids ?? []));
  const unroomedDevices = devices.filter((d) => !d.room && !roomedIds.has(d.id));

  const allRooms = [
    ...rooms,
    ...(unroomedDevices.length > 0
      ? [{ id: "other", name: "Other", device_ids: unroomedDevices.map((d) => d.id) }]
      : []),
  ];

  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-5">
      {/* Greeting */}
      <GreetingHeader />

      {/* Stats */}
      {!loading && <StatsOverview devices={devices} rooms={rooms} />}

      {/* Loading state */}
      {loading && (
        <div className="flex flex-col items-center py-10 gap-3 text-gray-300">
          <Loader2 size={28} className="animate-spin" />
          <span className="text-sm">Connecting to your home…</span>
        </div>
      )}

      {!loading && (
        <>
          {/* Active devices horizontal strip */}
          <ActiveDevicesStrip devices={devices} onUpdate={refresh} />

          {/* Quick scenes */}
          <QuickScenes />

          {/* Rooms grid */}
          {allRooms.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
                Rooms
              </h2>
              {allRooms.length === 0 ? (
                <EmptyRooms />
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {allRooms.map((room) => (
                    <RoomCard
                      key={room.id}
                      room={room}
                      devices={devicesForRoom(room)}
                    />
                  ))}
                </div>
              )}
            </section>
          )}

          {/* No devices at all */}
          {devices.length === 0 && <NoDevices />}
        </>
      )}

      {/* Ask Nexy bar — always shown */}
      <AskNexyBar />
    </div>
  );
}

function EmptyRooms() {
  return (
    <p className="text-sm text-gray-400 text-center py-4">
      No rooms configured yet.
    </p>
  );
}

function NoDevices() {
  return (
    <div className="flex flex-col items-center py-10 gap-3 text-center">
      <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center text-2xl">
        🏠
      </div>
      <div>
        <p className="font-semibold text-gray-700 text-sm">No devices found</p>
        <p className="text-xs text-gray-400 mt-1 max-w-xs leading-relaxed">
          Configure your IKEA Dirigera hub in{" "}
          <code className="bg-gray-100 px-1 rounded text-[11px]">backend/.env</code>{" "}
          to see your devices here.
        </p>
      </div>
    </div>
  );
}
