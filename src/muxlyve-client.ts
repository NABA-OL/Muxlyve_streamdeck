export interface MuxlyveDestination {
  name: string;
  url: string;
  enabled: boolean;
  playable: boolean;
  relaying: boolean;
  status: "live" | "connecting" | "reconnecting" | "failed" | "idle";
  attempts: number;
}

export interface MuxlyveState {
  live: boolean;
  uptime: number;
  destinations: MuxlyveDestination[];
}

export interface DestinationToggleResult {
  ok: boolean;
  created: boolean;
  state?: MuxlyveState;
}

const PLATFORM_NAMES: Record<string, string> = {
  twitch: "Twitch",
  youtube: "YouTube",
  kick: "Kick",
  tiktok: "TikTok",
};

function platformName(platform: string | undefined): string {
  if (!platform) return platform ?? "";
  return PLATFORM_NAMES[platform.toLowerCase()] ?? platform;
}

export class MuxlyveClient {
  private port: number;

  constructor(port: number) {
    this.port = port;
  }

  setStatePort(port: number): void {
    this.port = port;
  }

  private base(): string {
    return `http://127.0.0.1:${this.port}`;
  }

  async getState(): Promise<MuxlyveState> {
    const res = await fetch(`${this.base()}/api/state`, {
      signal: AbortSignal.timeout(2000),
    });
    if (!res.ok) {
      throw new Error(`GET /api/state -> ${res.status}`);
    }
    return (await res.json()) as MuxlyveState;
  }

  findDestination(state: MuxlyveState, platform: string | undefined): MuxlyveDestination | undefined {
    const name = platformName(platform);
    if (!name) return undefined;
    const target = name.toLowerCase();
    return state.destinations.find((d) => d.name.toLowerCase() === target);
  }

  async toggle(platform: string, state: MuxlyveState): Promise<DestinationToggleResult> {
    const dest = this.findDestination(state, platform);
    if (!dest) {
      return { ok: false, created: false };
    }
    const newEnabled = !dest.enabled;
    const res = await fetch(`${this.base()}/api/destinations`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: dest.name, url: dest.url, enabled: newEnabled }),
      signal: AbortSignal.timeout(4000),
    });
    if (!res.ok) {
      throw new Error(`POST /api/destinations -> ${res.status}`);
    }
    const newState = (await res.json()) as MuxlyveState;
    return { ok: true, created: false, state: newState };
  }

  async retry(platform: string): Promise<void> {
    const name = platformName(platform);
    const res = await fetch(`${this.base()}/api/retry?name=${encodeURIComponent(name)}`, {
      method: "POST",
      signal: AbortSignal.timeout(4000),
    });
    if (!res.ok) {
      throw new Error(`POST /api/retry -> ${res.status}`);
    }
  }
}

export { platformName };
