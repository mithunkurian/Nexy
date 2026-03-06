export type DeviceType =
  | "light"
  | "blind"
  | "plug"
  | "sensor"
  | "speaker"
  | "thermostat"
  | "lock"
  | "unknown";

export type DeviceSource = "ikea" | "matter" | "virtual";

export interface DeviceState {
  is_on?: boolean;
  brightness?: number;   // 0–100
  color_temp?: number;   // Kelvin
  color_hue?: number;
  color_saturation?: number;
  position?: number;     // blind %
  temperature?: number;
  humidity?: number;
  battery?: number;
}

export interface Device {
  id: string;
  name: string;
  room?: string;
  type: DeviceType;
  source: DeviceSource;
  reachable: boolean;
  state: DeviceState;
}

export interface Room {
  id: string;
  name: string;
  icon?: string;
  device_ids?: string[];
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface AIAction {
  action: string;
  target_ids: string[];
  target_rooms: string[];
  params: Record<string, unknown>;
}

export interface ChatResponse {
  reply: string;
  actions_taken: AIAction[];
}
