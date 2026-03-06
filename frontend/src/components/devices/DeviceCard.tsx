"use client";
import { useState } from "react";
import {
  Lightbulb,
  Power,
  Blinds,
  Thermometer,
  Radio,
  Lock,
  HelpCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Slider } from "@/components/ui/Slider";
import { Badge } from "@/components/ui/Badge";
import { api } from "@/lib/api";
import { logActivity } from "@/lib/activity";
import type { Device } from "@/types";

const typeIcons: Record<string, React.ElementType> = {
  light: Lightbulb,
  plug: Power,
  blind: Blinds,
  thermostat: Thermometer,
  sensor: Thermometer,
  speaker: Radio,
  lock: Lock,
  unknown: HelpCircle,
};

interface DeviceCardProps {
  device: Device;
  onUpdate?: (device: Device) => void;
}

export function DeviceCard({ device, onUpdate }: DeviceCardProps) {
  const [pending, setPending] = useState(false);
  const Icon = typeIcons[device.type] ?? HelpCircle;
  const isOn = device.state.is_on ?? false;

  async function toggle() {
    setPending(true);
    try {
      await api.devices.command(device.id, { is_on: !isOn });
      onUpdate?.({ ...device, state: { ...device.state, is_on: !isOn } });
      logActivity({
        icon: isOn ? "💡" : "🌑",
        title: `${device.name} turned ${isOn ? "off" : "on"}`,
        detail: device.room ?? device.source,
      });
    } finally {
      setPending(false);
    }
  }

  async function setBrightness(brightness: number) {
    await api.devices.command(device.id, { brightness });
    onUpdate?.({ ...device, state: { ...device.state, brightness } });
  }

  const sourceBadge = device.source === "ikea" ? "IKEA" : "Matter";

  return (
    <div
      className={cn(
        "rounded-2xl p-4 border transition-all duration-200 select-none",
        isOn
          ? "bg-nexy-50 border-nexy-200 shadow-sm shadow-nexy-100"
          : "bg-white border-gray-100",
        !device.reachable && "opacity-50",
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex items-center gap-2 min-w-0">
          <div
            className={cn(
              "flex-shrink-0 p-2 rounded-xl",
              isOn ? "bg-nexy-100 text-nexy-600" : "bg-gray-100 text-gray-400",
            )}
          >
            <Icon size={18} />
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-sm text-gray-900 truncate">{device.name}</p>
            {device.room && (
              <p className="text-xs text-gray-400 truncate">{device.room}</p>
            )}
          </div>
        </div>
        <div className="flex flex-col items-end gap-1 flex-shrink-0">
          <Badge variant={device.reachable ? "default" : "danger"}>
            {sourceBadge}
          </Badge>
          <button
            onClick={toggle}
            disabled={pending || !device.reachable}
            className={cn(
              "relative w-10 h-5 rounded-full transition-colors duration-200",
              isOn ? "bg-nexy-500" : "bg-gray-300",
              pending && "opacity-60",
            )}
            aria-label={isOn ? "Turn off" : "Turn on"}
          >
            <span
              className={cn(
                "absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200",
                isOn && "translate-x-5",
              )}
            />
          </button>
        </div>
      </div>

      {/* Brightness slider (lights only) */}
      {device.type === "light" && isOn && device.state.brightness !== undefined && (
        <Slider
          value={device.state.brightness}
          onChange={setBrightness}
          label="Brightness"
          className="mt-1"
        />
      )}

      {/* Sensor readings */}
      {device.type === "sensor" && (
        <div className="flex gap-3 text-xs text-gray-500 mt-1">
          {device.state.temperature !== undefined && (
            <span>{device.state.temperature.toFixed(1)}°C</span>
          )}
          {device.state.humidity !== undefined && (
            <span>{device.state.humidity.toFixed(0)}% RH</span>
          )}
          {device.state.battery !== undefined && (
            <span>🔋 {device.state.battery}%</span>
          )}
        </div>
      )}
    </div>
  );
}
