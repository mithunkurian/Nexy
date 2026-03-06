"use client";

const QUICK_COMMANDS = [
  "Turn off all lights",
  "Good morning scene",
  "Movie mode",
  "I'm leaving home",
  "Bedtime mode",
  "What devices are on?",
];

interface QuickCommandsProps {
  onSelect: (cmd: string) => void;
}

export function QuickCommands({ onSelect }: QuickCommandsProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {QUICK_COMMANDS.map((cmd) => (
        <button
          key={cmd}
          onClick={() => onSelect(cmd)}
          className="px-3 py-1.5 text-xs rounded-full bg-nexy-50 text-nexy-700 border border-nexy-200 hover:bg-nexy-100 transition-colors"
        >
          {cmd}
        </button>
      ))}
    </div>
  );
}
