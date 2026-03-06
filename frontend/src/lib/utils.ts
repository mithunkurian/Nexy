import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function kelvinToLabel(k: number): string {
  if (k <= 2700) return "Warm";
  if (k <= 4000) return "Neutral";
  return "Cool";
}

export function brightnessLabel(b: number): string {
  if (b === 0) return "Off";
  if (b < 30) return "Dim";
  if (b < 70) return "Medium";
  return "Bright";
}
