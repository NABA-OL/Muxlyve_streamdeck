import { action, SingletonAction } from "@elgato/streamdeck";
import { MuxlyveClient, MuxlyveState, DestinationState } from "../muxlyve-client.js";

interface ToggleDestinationSettings {
  platform?: string;
  panelPort?: string;
}

abstract class BaseToggleDestinationAction extends SingletonAction {
  private client?: MuxlyveClient;
  private lastState?: MuxlyveState;
  private context?: string;

  protected abstract readonly defaultPlatform: string;

  constructor(private readonly streamDeck: any) {
    super();
    setInterval(() => {
      void this.refreshState(false);
    }, 2500);
  }

  onWillAppear(ev: any): void | Promise<void> {
    this.context = ev.context ?? ev.action?.context;
    this.applySettings(ev.payload.settings ?? {});
  }

  onDidReceiveSettings(ev: any): void | Promise<void> {
    this.context = ev.context ?? ev.action?.context;
    this.applySettings(ev.payload.settings ?? {});
  }

  onKeyDown(ev: any): void | Promise<void> {
    this.context = ev.context ?? ev.action?.context;
    const settings = ev.payload.settings ?? {};
    const platform = this.normalizePlatform(settings.platform) ?? this.defaultPlatform;
    void this.togglePlatform(platform);
  }

  onKeyUp(_ev: any): void | Promise<void> {
    // No-op
  }

  private applySettings(settings: ToggleDestinationSettings): void {
    const platform = this.normalizePlatform(settings.platform) ?? this.defaultPlatform;
    const port = Number.parseInt(settings.panelPort ?? "19080", 10) || 19080;
    this.client = new MuxlyveClient(port);
    void this.refreshState(true);
    void this.setTitle(platform);
  }

  private async togglePlatform(platform: string): Promise<void> {
    const client = this.client;
    if (!client) {
      await this.showAlert();
      return;
    }

    try {
      const state = await client.getState();
      const destination = state.destinations.find((item) => this.matchesPlatform(item.name, platform));
      if (!destination) {
        await this.showAlert();
        await this.showDisabledState(platform, "no-configured");
        return;
      }

      const updated = await client.toggleDestination(destination);
      this.lastState = updated;
      await this.renderState(platform, updated);
      await this.showOk();
    } catch {
      await this.showAlert();
      await this.renderOfflineState(platform);
    }
  }

  private async refreshState(forceRender: boolean): Promise<void> {
    const client = this.client;
    if (!client) {
      return;
    }

    try {
      const state = await client.getState();
      this.lastState = state;
      await this.renderState(this.defaultPlatform, state);
    } catch {
      if (forceRender || !this.lastState) {
        await this.renderOfflineState(this.defaultPlatform);
      }
    }
  }

  private async renderState(platform: string, state: MuxlyveState): Promise<void> {
    const destination = state.destinations.find((item) => this.matchesPlatform(item.name, platform));
    if (!destination) {
      await this.showDisabledState(platform, "no-configured");
      return;
    }

    const variant = this.getVisualState(destination, state.live);
    await this.setImageForPlatform(platform, variant);
    await this.setTitle(platform);
  }

  private async renderOfflineState(platform: string): Promise<void> {
    await this.showDisabledState(platform, "offline");
  }

  private async showDisabledState(platform: string, reason: "offline" | "no-configured"): Promise<void> {
    await this.setImageForPlatform(platform, reason === "offline" ? "offline" : "disabled");
    await this.setTitle(platform);
  }

  private async setTitle(platform: string): Promise<void> {
    const label = platform.charAt(0).toUpperCase() + platform.slice(1);
    await this.streamDeck.client.setTitle(this.context ?? "", label);
  }

  private async setImageForPlatform(platform: string, variant: string = "default"): Promise<void> {
    const imagePath = this.resolveImagePath(platform, variant);
    await this.streamDeck.client.setImage(this.context ?? "", imagePath);
  }

  private resolveImagePath(platform: string, variant: string): string {
    const normalized = platform.toLowerCase();
    return `./imgs/actions/${normalized}/${variant}.png`;
  }

  private getVisualState(destination: DestinationState, live: boolean): string {
    if (!destination.enabled) {
      return "off";
    }

    if (destination.status === "failed") {
      return "error";
    }

    if (destination.status === "connecting" || destination.status === "reconnecting") {
      return "connecting";
    }

    if (destination.status === "live") {
      return live ? "on" : "idle";
    }

    return "idle";
  }

  private normalizePlatform(value?: string): string {
    const normalized = (value ?? "").trim().toLowerCase();
    if (["twitch", "youtube", "kick", "tiktok"].includes(normalized)) {
      return normalized;
    }
    return this.defaultPlatform;
  }

  private matchesPlatform(name: string, platform: string): boolean {
    return name.trim().toLowerCase() === platform.toLowerCase();
  }

  private async showAlert(): Promise<void> {
    await this.streamDeck.client.showAlert(this.context ?? "");
  }

  private async showOk(): Promise<void> {
    await this.streamDeck.client.showOk(this.context ?? "");
  }
}

@action({ UUID: "com.blackraken.muxlyve.streamdeck.toggle.twitch" })
export class TwitchToggleDestinationAction extends BaseToggleDestinationAction {
  protected override readonly defaultPlatform = "twitch";
}

@action({ UUID: "com.blackraken.muxlyve.streamdeck.toggle.youtube" })
export class YoutubeToggleDestinationAction extends BaseToggleDestinationAction {
  protected override readonly defaultPlatform = "youtube";
}

@action({ UUID: "com.blackraken.muxlyve.streamdeck.toggle.kick" })
export class KickToggleDestinationAction extends BaseToggleDestinationAction {
  protected override readonly defaultPlatform = "kick";
}

@action({ UUID: "com.blackraken.muxlyve.streamdeck.toggle.tiktok" })
export class TikTokToggleDestinationAction extends BaseToggleDestinationAction {
  protected override readonly defaultPlatform = "tiktok";
}
