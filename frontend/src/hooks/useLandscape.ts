"use client";
import { useEffect, useState } from "react";

/**
 * Returns true when the device is in landscape orientation.
 * Safe for SSR — always starts as false, updates after mount.
 */
export function useLandscape(): boolean {
  const [landscape, setLandscape] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(orientation: landscape)");
    setLandscape(mq.matches);
    const handler = (e: MediaQueryListEvent) => setLandscape(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  return landscape;
}
