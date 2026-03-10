import type { Device, Room, ChatMessage, ChatResponse } from "@/types";
import { loadSettings } from "./settings";
import { auth } from "./firebase";

function apiBase(): string {
  const s = loadSettings();
  return `${s.backendUrl.replace(/\/$/, "")}/api/v1`;
}

async function authHeaders(): Promise<Record<string, string>> {
  const token = await auth.currentUser?.getIdToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function get<T>(path: string): Promise<T> {
  const headers = await authHeaders();
  const res = await fetch(`${apiBase()}${path}`, { cache: "no-store", headers });
  if (!res.ok) throw new Error(`GET ${path} → ${res.status}`);
  return res.json();
}

async function post<T>(path: string, body: unknown): Promise<T> {
  const headers = await authHeaders();
  const res = await fetch(`${apiBase()}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`POST ${path} → ${res.status}`);
  return res.json();
}

export const api = {
  devices: {
    list: () => get<Device[]>("/devices/"),
    rooms: () => get<Room[]>("/devices/rooms"),
    get: (id: string) => get<Device>(`/devices/${id}`),
    command: (id: string, cmd: Partial<Device["state"]>) =>
      post<{ ok: boolean }>(`/devices/${id}/command`, cmd),
  },
  ai: {
    chat: (message: string, history: ChatMessage[]) =>
      post<ChatResponse>("/ai/chat", { message, history }),

    streamChat: async (
      message: string,
      history: ChatMessage[],
      onToken: (token: string) => void,
    ): Promise<void> => {
      const headers = await authHeaders();
      const res = await fetch(`${apiBase()}/ai/chat/stream`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...headers },
        body: JSON.stringify({ message, history }),
      });
      if (!res.body) return;
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        onToken(decoder.decode(value, { stream: true }));
      }
    },
  },
};
