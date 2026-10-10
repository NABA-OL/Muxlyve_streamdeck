/*
 * Propiedad de BlacKraken Solutions
 * Desarrollado por: NABAOL
 * Fecha de creación: 2026-10-10
 * Correo: nabaol.dev@gmail.com
 * Copyright (c) 2026 BlacKraken Solutions. Todos los derechos reservados.
 */
import streamDeck from "@elgato/streamdeck";
import type { JsonValue } from "@elgato/utils";
import { MuxlyveClient } from "../muxlyve-client.js";

export interface NetworkSettings {
  panelHost?: string;
  panelPort?: string;
  panelToken?: string;
  [key: string]: JsonValue;
}

const DEFAULT_HOST = "127.0.0.1";
const VALID_HOST = /^[A-Za-z0-9.-]+$/;

function resolveHost(rawHost: string | undefined): string {
  const host = (rawHost ?? "").trim();
  if (!host) {
    return DEFAULT_HOST;
  }
  if (!VALID_HOST.test(host)) {
    streamDeck.logger.warn(`panelHost inválido, se usa ${DEFAULT_HOST}`);
    return DEFAULT_HOST;
  }
  return host;
}

export function buildClient(settings: NetworkSettings): MuxlyveClient {
  const port = Number.parseInt(settings.panelPort ?? "19080", 10) || 19080;
  const host = resolveHost(settings.panelHost);
  const token = (settings.panelToken ?? "").trim() || undefined;
  return new MuxlyveClient(port, host, token);
}

export function describeError(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

interface Logger {
  error(message: string): void;
  info(message: string): void;
}

/**
 * Logs connection failures only on the down/up transition, not on every
 * failed poll — avoids flooding the plugin log while Muxlyve is closed.
 */
export class ConnectivityLog {
  private isDown = false;

  reportFailure(logger: Logger, message: string): void {
    if (!this.isDown) {
      logger.error(message);
      this.isDown = true;
    }
  }

  reportSuccess(logger: Logger, message: string): void {
    if (this.isDown) {
      logger.info(message);
      this.isDown = false;
    }
  }
}

export type RecorderDuration = 60 | 300 | 600 | 900;

export function normalizeDuration(value: unknown): RecorderDuration {
  const parsed = Number.parseInt(String(value ?? "60"), 10);
  return parsed === 300 || parsed === 600 || parsed === 900 ? parsed : 60;
}
