export type DestinationStatus = "live" | "connecting" | "reconnecting" | "failed" | "idle";

export interface DestinationState {
  name: string;
  url?: string;
  enabled: boolean;
  playable?: boolean;
  relaying?: boolean;
  status?: DestinationStatus;
  attempts?: number;
}

export interface MuxlyveState {
  live: boolean;
  uptime: number;
  destinations: DestinationState[];
}

export interface ToggleDestinationPayload {
  name: string;
  url?: string;
  enabled: boolean;
}

export class MuxlyveClient {
  constructor(
    private readonly port: number = 19080,
    private readonly host: string = "127.0.0.1",
    private readonly token?: string,
  ) {}

  getBaseUrl(): string {
    return `http://${this.host}:${this.port}`;
  }

  private getHeaders(): HeadersInit {
    return this.token ? { Authorization: `Bearer ${this.token}` } : {};
  }

  async getState(): Promise<MuxlyveState> {
    const response = await fetch(`${this.getBaseUrl()}/api/state`, {
      headers: this.getHeaders(),
    });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    return (await response.json()) as MuxlyveState;
  }

  async toggleDestination(destination: DestinationState): Promise<MuxlyveState> {
    const payload: ToggleDestinationPayload = {
      name: destination.name,
      url: destination.url,
      enabled: !destination.enabled,
    };

    const response = await fetch(`${this.getBaseUrl()}/api/destinations`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...this.getHeaders() },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    return (await response.json()) as MuxlyveState;
  }
}
