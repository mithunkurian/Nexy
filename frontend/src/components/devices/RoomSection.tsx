"use client";
import { DeviceCard } from "./DeviceCard";
import type { Device, Room } from "@/types";

interface RoomSectionProps {
  room: Room;
  devices: Device[];
  onDeviceUpdate?: (device: Device) => void;
}

export function RoomSection({ room, devices, onDeviceUpdate }: RoomSectionProps) {
  if (devices.length === 0) return null;

  return (
    <section>
      <h2 className="text-base font-semibold text-gray-700 mb-3 flex items-center gap-2">
        {room.icon && <span className="text-lg">{room.icon}</span>}
        {room.name}
        <span className="text-xs text-gray-400 font-normal">
          {devices.length} device{devices.length !== 1 ? "s" : ""}
        </span>
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {devices.map((d) => (
          <DeviceCard key={d.id} device={d} onUpdate={onDeviceUpdate} />
        ))}
      </div>
    </section>
  );
}
