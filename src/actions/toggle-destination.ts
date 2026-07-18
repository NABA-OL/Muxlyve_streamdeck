import { action, SingletonAction, KeyDownEvent, WillAppearEvent, WillDisappearEvent, DidReceiveSettingsEvent, streamDeck } from "@elgato/streamdeck";
import type { JsonObject } from "@elgato/utils";
import { MuxlyveClient, MuxlyveState, platformName } from "../muxlyve-client.js";

interface ToggleSettings extends JsonObject {
  platform?: string;
  port?: number;
}

const DEFAULT_PORT = 19080;
const POLL_INTERVAL_MS = 2500;

type VisualState = "on" | "off" | "disconnected" | "unconfigured";

interface Renderable {
  id: string;
  setImage(path: string): Promise<void>;
  setTitle(title: string): Promise<void>;
  showAlert(): Promise<void>;
}

interface KeyContext {
  settings: ToggleSettings;
  client: MuxlyveClient;
  lastState: MuxlyveState | null;
  connected: boolean;
  action: Renderable;
}

class ToggleDestinationActionBase extends SingletonAction<ToggleSettings> {
  private contexts = new Map<string, KeyContext>();
  private pollTimer: NodeJS.Timeout | null = null;

  constructor() {
    super();
    this.startPolling();
  }

  private ensureContext(act: Renderable, settings: Partial<ToggleSettings>): KeyContext {
    let ctx = this.contexts.get(act.id);
    if (!ctx) {
      const port = settings.port || DEFAULT_PORT;
      const platform = settings.platform || "twitch";
      ctx = {
        settings: { platform, port },
        client: new MuxlyveClient(port),
        lastState: null,
        connected: false,
        action: act,
      };
      this.contexts.set(act.id, ctx);
    } else {
      ctx.action = act;
    }
    return ctx;
  }

  override async onWillAppear(ev: WillAppearEvent<ToggleSettings>): Promise<void> {
    const ctx = this.ensureContext(ev.action, ev.payload.settings);
    ctx.settings = { ...ctx.settings, ...ev.payload.settings };
    ctx.client.setStatePort(ctx.settings.port || DEFAULT_PORT);
    await this.render(ctx);
  }

  override async onWillDisappear(ev: WillDisappearEvent<ToggleSettings>): Promise<void> {
    this.contexts.delete(ev.action.id);
  }

  override async onDidReceiveSettings(ev: DidReceiveSettingsEvent<ToggleSettings>): Promise<void> {
    const ctx = this.ensureContext(ev.action, ev.payload.settings);
    ctx.settings = { ...ctx.settings, ...ev.payload.settings };
    ctx.client.setStatePort(ctx.settings.port || DEFAULT_PORT);
    await this.render(ctx);
  }

  override async onKeyDown(ev: KeyDownEvent<ToggleSettings>): Promise<void> {
    const ctx = this.ensureContext(ev.action, ev.payload.settings);
    try {
      if (!ctx.lastState) {
        ctx.lastState = await ctx.client.getState();
        ctx.connected = true;
      }
      const dest = ctx.client.findDestination(ctx.lastState, ctx.settings.platform);
      if (!dest) {
        await ctx.action.showAlert();
        return;
      }
      const result = await ctx.client.toggle(ctx.settings.platform ?? "twitch", ctx.lastState);
      if (result.state) {
        ctx.lastState = result.state;
      }
      await this.render(ctx);
    } catch {
      ctx.connected = false;
      ctx.lastState = null;
      await ctx.action.showAlert();
      await this.render(ctx);
    }
  }

  private startPolling(): void {
    this.pollTimer = setInterval(async () => {
      for (const ctx of this.contexts.values()) {
        try {
          const state = await ctx.client.getState();
          ctx.lastState = state;
          ctx.connected = true;
        } catch {
          ctx.connected = false;
          ctx.lastState = null;
        }
        await this.render(ctx);
      }
    }, POLL_INTERVAL_MS);
    this.pollTimer.unref?.();
  }

  private visualState(ctx: KeyContext): VisualState {
    if (!ctx.connected || !ctx.lastState) return "disconnected";
    const dest = ctx.client.findDestination(ctx.lastState, ctx.settings.platform);
    if (!dest) return "unconfigured";
    return dest.enabled ? "on" : "off";
  }

  private imagePath(ctx: KeyContext): string {
    const platform = ctx.settings.platform || "twitch";
    const base = `imgs/actions/${platform}`;
    switch (this.visualState(ctx)) {
      case "on":
        return `${base}/on.png`;
      case "off":
        return `${base}/off.png`;
      case "unconfigured":
        return `${base}/unconfigured.png`;
      case "disconnected":
      default:
        return `${base}/disconnected.png`;
    }
  }

  private titleFor(ctx: KeyContext): string {
    const name = platformName(ctx.settings.platform);
    const vs = this.visualState(ctx);
    if (vs === "disconnected") return `${name}\noffline`;
    if (vs === "unconfigured") return `${name}\n?`;
    const dest = ctx.client.findDestination(ctx.lastState!, ctx.settings.platform);
    if (dest && dest.enabled) {
      return ctx.lastState!.live ? name : `${name}\narmed`;
    }
    return name;
  }

  private async render(ctx: KeyContext): Promise<void> {
    try {
      await ctx.action.setImage(this.imagePath(ctx));
      await ctx.action.setTitle(this.titleFor(ctx));
    } catch {
      /* key may have disappeared */
    }
  }
}

@action({ UUID: "com.naba.muxlyve.streamdeck.toggle.twitch" })
export class TwitchToggleAction extends ToggleDestinationActionBase {}

@action({ UUID: "com.naba.muxlyve.streamdeck.toggle.youtube" })
export class YouTubeToggleAction extends ToggleDestinationActionBase {}

@action({ UUID: "com.naba.muxlyve.streamdeck.toggle.kick" })
export class KickToggleAction extends ToggleDestinationActionBase {}

@action({ UUID: "com.naba.muxlyve.streamdeck.toggle.tiktok" })
export class TikTokToggleAction extends ToggleDestinationActionBase {}
