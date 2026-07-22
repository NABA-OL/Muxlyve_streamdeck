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

export interface RecorderState {
  active: boolean;
  duration: number;
}

export interface MuxlyveState {
  live: boolean;
  uptime: number;
  destinations: DestinationState[];
  recorder: RecorderState;
}

export interface ToggleDestinationPayload {
  name: string;
  url?: string;
  enabled: boolean;
}

export interface SaveClipResult {
  ok: boolean;
  path: string;
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

  async getState(): Promise<MuxlyveState> {
    return this.request<MuxlyveState>("GET", "/api/state");
  }

  async toggleDestination(destination: DestinationState): Promise<MuxlyveState> {
    const payload: ToggleDestinationPayload = {
      name: destination.name,
      url: destination.url,
      enabled: !destination.enabled,
    };
    return this.request<MuxlyveState>("POST", "/api/destinations", payload);
  }

  async startRecording(duration: number): Promise<MuxlyveState> {
    return this.request<MuxlyveState>("POST", "/api/record/start", { duration });
  }

  async stopRecording(): Promise<MuxlyveState> {
    return this.request<MuxlyveState>("POST", "/api/record/stop");
  }

  async saveClip(duration: number): Promise<SaveClipResult> {
    return this.request<SaveClipResult>("POST", "/api/record/save", { duration });
  }

  private async request<T>(method: string, path: string, body?: unknown): Promise<T> {
    const headers: Record<string, string> = { ...this.getAuthHeader() };
    if (body !== undefined) {
      headers["Content-Type"] = "application/json";
    }

    const response = await fetch(`${this.getBaseUrl()}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      throw new Error(await this.describeFailure(`${method} ${path}`, response));
    }

    return (await response.json()) as T;
  }

  private getAuthHeader(): Record<string, string> {
    return this.token ? { Authorization: `Bearer ${this.token}` } : {};
  }

  private async describeFailure(request: string, response: Response): Promise<string> {
    const body = await response.text().catch(() => "");
    return `${request} -> HTTP ${response.status}${body ? `: ${body.slice(0, 200)}` : ""}`;
  }
}
