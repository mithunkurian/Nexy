"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { loadSettings } from "@/lib/settings";
import type { Device, Room } from "@/types";

export function useDevices() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [rooms, setRooms]     = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const wsRef = useRef<WebSocket | null>(null);

  // Read backend URL from settings (localStorage) so it respects user config
  function getUrls() {
    const s = loadSettings();
    const base = s.backendUrl.replace(/\/$/, "");
    const ws   = s.wsUrl || `${base.replace(/^http/, "ws")}/api/v1/ws`;
    return { base, ws };
  }

  const refresh = useCallback(async () => {
    const { base } = getUrls();
    try {
      const [devRes, rmRes] = await Promise.all([
        fetch(`${base}/api/v1/devices/`),
        fetch(`${base}/api/v1/devices/rooms`),
      ]);
      const [devs, rms] = await Promise.all([devRes.json(), rmRes.json()]);
      setDevices(Array.isArray(devs) ? devs : []);
      setRooms(Array.isArray(rms) ? rms : []);
    } catch (e) {
      console.warn("Could not reach Nexy backend:", e);
      setDevices([]);
      setRooms([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();

    const { ws: wsUrl } = getUrls();
    let ws: WebSocket;
    let ping: ReturnType<typeof setInterval>;

    try {
      ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onmessage = (evt) => {
        try {
          const { event, data } = JSON.parse(evt.data);
          if (event === "device_update") {
            setDevices((prev) =>
              prev.map((d) => (d.id === (data as Device).id ? { ...d, ...data } : d))
            );
          }
        } catch {}
      };

      ping = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) ws.send("ping");
      }, 25_000);
    } catch {
      // WebSocket not available (e.g. backend offline)
    }

    return () => {
      clearInterval(ping!);
      ws?.close();
    };
  }, [refresh]);

  return { devices, rooms, loading, refresh };
}
