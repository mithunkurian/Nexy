"use client";
import { useState } from "react";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

interface Scene {
  id: string;
  label: string;
  emoji: string;
  command: string;
}

const SCENES: Scene[] = [
  { id: "morning",  label: "Morning",  emoji: "🌅", command: "Good morning! Turn on lights in all rooms to 70% warm white." },
  { id: "movie",    label: "Movie",    emoji: "🎬", command: "Movie mode: dim all lights to 20%, turn off bright lights." },
  { id: "night",    label: "Night",    emoji: "🌙", command: "Bedtime: turn off all lights except the bedroom nightlight at 10%." },
  { id: "away",     label: "Away",     emoji: "🔒", command: "I'm leaving. Turn off all lights and plugs." },
  { id: "alloff",   label: "All Off",  emoji: "⚡", command: "Turn off every light and plug in the home." },
  { id: "bright",   label: "Bright",   emoji: "☀️", command: "Maximum brightness on all lights." },
];

export function QuickScenes() {
  const [active, setActive] = useState<string | null>(null);

  async function activate(scene: Scene) {
    if (active) return;
    setActive(scene.id);
    try {
      await api.ai.chat(scene.command, []);
    } catch (e) {
      console.error("Scene failed", e);
    } finally {
      setActive(null);
    }
  }

  return (
    <section>
      <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
        Quick Scenes
      </h2>
      <div className="flex gap-2.5 flex-wrap">
        {SCENES.map((scene) => {
          const isLoading = active === scene.id;
          return (
            <button
              key={scene.id}
              onClick={() => activate(scene)}
              disabled={!!active}
              className={cn(
                "flex items-center gap-2 px-3.5 py-2 rounded-xl border text-sm font-medium transition-all",
                isLoading
                  ? "bg-nexy-500 text-white border-nexy-500 shadow-md shadow-nexy-100"
                  : "bg-white text-gray-700 border-gray-100 hover:border-nexy-200 hover:bg-nexy-50 hover:text-nexy-700 shadow-sm",
                !!active && !isLoading && "opacity-50 cursor-not-allowed",
              )}
            >
              {isLoading ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <span className="text-base leading-none">{scene.emoji}</span>
              )}
              {scene.label}
            </button>
          );
        })}
      </div>
    </section>
  );
}
