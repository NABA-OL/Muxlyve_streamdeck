import streamDeck, {
  action,
  SingletonAction,
  type DidReceiveSettingsEvent,
  type KeyAction,
  type KeyDownEvent,
  type WillAppearEvent,
} from "@elgato/streamdeck";
import type { JsonValue } from "@elgato/utils";
import { MuxlyveClient, MuxlyveState, DestinationState } from "../muxlyve-client.js";

type ToggleDestinationSettings = {
  platform?: string;
  panelHost?: string;
  panelPort?: string;
  panelToken?: string;
  [key: string]: JsonValue;
};

abstract class BaseToggleDestinationAction extends SingletonAction<ToggleDestinationSettings> {
  private client?: MuxlyveClient;
  private lastState?: MuxlyveState;
  private keyAction?: KeyAction<ToggleDestinationSettings>;

  protected abstract readonly defaultPlatform: string;

  constructor() {
    super();
    setInterval(() => {
      void this.refreshState(false);
    }, 2500);
  }

  onWillAppear(ev: WillAppearEvent<ToggleDestinationSettings>): void | Promise<void> {
    if (!ev.action.isKey()) {
      return;
    }
    this.keyAction = ev.action;
    this.applySettings(ev.payload.settings ?? {});
  }

  onDidReceiveSettings(ev: DidReceiveSettingsEvent<ToggleDestinationSettings>): void | Promise<void> {
    if (!ev.action.isKey()) {
      return;
    }
    this.keyAction = ev.action;
    this.applySettings(ev.payload.settings ?? {});
  }

  onKeyDown(ev: KeyDownEvent<ToggleDestinationSettings>): void | Promise<void> {
    this.keyAction = ev.action;
    const settings = ev.payload.settings ?? {};
    const platform = this.normalizePlatform(settings.platform) ?? this.defaultPlatform;
    void this.togglePlatform(platform);
  }

  private applySettings(settings: ToggleDestinationSettings): void {
    const platform = this.normalizePlatform(settings.platform) ?? this.defaultPlatform;
    const port = Number.parseInt(settings.panelPort ?? "19080", 10) || 19080;
    const host = (settings.panelHost ?? "").trim() || "127.0.0.1";
    const token = (settings.panelToken ?? "").trim() || undefined;
    this.client = new MuxlyveClient(port, host, token);
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
    } catch (error) {
      streamDeck.logger.error(`[${platform}] togglePlatform failed: ${this.describeError(error)}`);
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
    } catch (error) {
      streamDeck.logger.error(`[${this.defaultPlatform}] refreshState failed: ${this.describeError(error)}`);
      if (forceRender || !this.lastState) {
        await this.renderOfflineState(this.defaultPlatform);
      }
    }
  }

  private describeError(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
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
    await this.keyAction?.setTitle(label);
  }

  private async setImageForPlatform(platform: string, variant: string): Promise<void> {
    const imagePath = this.resolveImagePath(platform, variant);
    await this.keyAction?.setImage(imagePath);
  }

  private resolveImagePath(platform: string, variant: string): string {
    const normalized = platform.toLowerCase();
    return `imgs/actions/${normalized}/${variant}.png`;
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
    await this.keyAction?.showAlert();
  }

  private async showOk(): Promise<void> {
    await this.keyAction?.showOk();
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
