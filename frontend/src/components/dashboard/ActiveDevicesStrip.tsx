"use client";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import { Lightbulb, Power, Blinds } from "lucide-react";
import type { Device } from "@/types";
import { useState } from "react";

const TYPE_ICONS: Record<string, React.ElementType> = {
  light: Lightbulb,
  plug:  Power,
  blind: Blinds,
};

interface ActiveDevicesStripProps {
  devices: Device[];
  onUpdate: () => void;
}

export function ActiveDevicesStrip({ devices, onUpdate }: ActiveDevicesStripProps) {
  const active = devices.filter((d) => d.state.is_on);
  const [pending, setPending] = useState<string | null>(null);

  if (active.length === 0) return null;

  async function turnOff(device: Device) {
    if (pending) return;
    setPending(device.id);
    try {
      await api.devices.command(device.id, { is_on: false });
      onUpdate();
    } finally {
      setPending(null);
    }
  }

  return (
    <section>
      <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
        Active Now
      </h2>
      <div className="flex gap-2.5 overflow-x-auto pb-1 -mx-1 px-1 snap-x">
        {active.map((d) => {
          const Icon = TYPE_ICONS[d.type] ?? Lightbulb;
          const isOff = pending === d.id;
          return (
            <button
              key={d.id}
              onClick={() => turnOff(d)}
              disabled={!!pending}
              className={cn(
                "snap-start flex-shrink-0 flex flex-col items-start gap-2 rounded-2xl p-3.5 border w-32",
                "bg-white border-nexy-100 shadow-sm text-left",
                "hover:bg-red-50 hover:border-red-200 transition-all",
                isOff && "opacity-50",
              )}
            >
              <div className="w-8 h-8 rounded-xl bg-nexy-100 flex items-center justify-center">
                <Icon size={15} className="text-nexy-600" />
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-800 truncate w-full leading-snug">
                  {d.name}
                </p>
                {d.room && (
                  <p className="text-[10px] text-gray-400 truncate">{d.room}</p>
                )}
              </div>
              <span className="text-[10px] text-red-400 font-medium">Tap to turn off</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
