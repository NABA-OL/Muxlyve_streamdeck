import type { JsonValue } from "@elgato/utils";
import { MuxlyveClient } from "../muxlyve-client.js";

export interface NetworkSettings {
  panelHost?: string;
  panelPort?: string;
  panelToken?: string;
  [key: string]: JsonValue;
}

export function buildClient(settings: NetworkSettings): MuxlyveClient {
  const port = Number.parseInt(settings.panelPort ?? "19080", 10) || 19080;
  const host = (settings.panelHost ?? "").trim() || "127.0.0.1";
  const token = (settings.panelToken ?? "").trim() || undefined;
  return new MuxlyveClient(port, host, token);
}

export function describeError(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export type RecorderDuration = 30 | 60 | 120;

export function normalizeDuration(value: unknown): RecorderDuration {
  const parsed = Number.parseInt(String(value ?? "60"), 10);
  return parsed === 30 || parsed === 120 ? parsed : 60;
}
