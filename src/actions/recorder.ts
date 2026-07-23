import streamDeck, {
  action,
  SingletonAction,
  type DidReceiveSettingsEvent,
  type KeyAction,
  type KeyDownEvent,
  type WillAppearEvent,
} from "@elgato/streamdeck";
import { MuxlyveClient, MuxlyveState } from "../muxlyve-client.js";
import { buildClient, describeError, normalizeDuration, type NetworkSettings, type RecorderDuration } from "./shared.js";

type BufferSettings = NetworkSettings & {
  duration?: string;
};

const FLASH_DURATION_MS = 800;

@action({ UUID: "com.blackraken.muxlyve.streamdeck.toggle.buffer" })
export class ToggleBufferAction extends SingletonAction<BufferSettings> {
  private client?: MuxlyveClient;
  private lastState?: MuxlyveState;
  private keyAction?: KeyAction<BufferSettings>;

  constructor() {
    super();
    setInterval(() => {
      void this.refreshState(false);
    }, 2500);
  }

  onWillAppear(ev: WillAppearEvent<BufferSettings>): void | Promise<void> {
    if (!ev.action.isKey()) {
      return;
    }
    this.keyAction = ev.action;
    this.applySettings(ev.payload.settings ?? {});
  }

  onDidReceiveSettings(ev: DidReceiveSettingsEvent<BufferSettings>): void | Promise<void> {
    if (!ev.action.isKey()) {
      return;
    }
    this.keyAction = ev.action;
    this.applySettings(ev.payload.settings ?? {});
  }

  onKeyDown(ev: KeyDownEvent<BufferSettings>): void | Promise<void> {
    this.keyAction = ev.action;
    void this.toggleBuffer(normalizeDuration(ev.payload.settings?.duration));
  }

  private applySettings(settings: BufferSettings): void {
    this.client = buildClient(settings);
    void this.refreshState(true);
  }

  private async toggleBuffer(duration: RecorderDuration): Promise<void> {
    const client = this.client;
    if (!client) {
      await this.keyAction?.showAlert();
      return;
    }

    try {
      const current = this.lastState ?? (await client.getState());
      const updated = current.recorder.active ? await client.stopRecording() : await client.startRecording(duration);
      this.lastState = updated;
      await this.render(updated);
      await this.keyAction?.showOk();
    } catch (error) {
      streamDeck.logger.error(`toggleBuffer failed: ${describeError(error)}`);
      await this.keyAction?.showAlert();
      await this.setImage("offline");
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
      await this.render(state);
    } catch (error) {
      streamDeck.logger.error(`refreshState (buffer) failed: ${describeError(error)}`);
      if (forceRender || !this.lastState) {
        await this.setImage("offline");
      }
    }
  }

  private async render(state: MuxlyveState): Promise<void> {
    if (!state.live) {
      await this.setImage("disabled");
      return;
    }

    await this.setImage(state.recorder.active ? "on" : "off");
  }

  private async setImage(variant: string): Promise<void> {
    await this.keyAction?.setImage(`imgs/actions/buffer/${variant}.png`);
  }
}

type ClipSettings = NetworkSettings & {
  duration?: string;
};

@action({ UUID: "com.blackraken.muxlyve.streamdeck.save.clip" })
export class SaveClipAction extends SingletonAction<ClipSettings> {
  private client?: MuxlyveClient;
  private lastState?: MuxlyveState;
  private keyAction?: KeyAction<ClipSettings>;

  constructor() {
    super();
    setInterval(() => {
      void this.refreshState();
    }, 2500);
  }

  onWillAppear(ev: WillAppearEvent<ClipSettings>): void | Promise<void> {
    if (!ev.action.isKey()) {
      return;
    }
    this.keyAction = ev.action;
    this.applySettings(ev.payload.settings ?? {});
  }

  onDidReceiveSettings(ev: DidReceiveSettingsEvent<ClipSettings>): void | Promise<void> {
    if (!ev.action.isKey()) {
      return;
    }
    this.keyAction = ev.action;
    this.applySettings(ev.payload.settings ?? {});
  }

  onKeyDown(ev: KeyDownEvent<ClipSettings>): void | Promise<void> {
    this.keyAction = ev.action;
    void this.saveClip(normalizeDuration(ev.payload.settings?.duration));
  }

  private applySettings(settings: ClipSettings): void {
    this.client = buildClient(settings);
    void this.refreshState();
  }

  private async saveClip(duration: RecorderDuration): Promise<void> {
    const client = this.client;
    if (!client || !this.lastState?.recorder.active) {
      await this.keyAction?.showAlert();
      return;
    }

    try {
      await client.saveClip(duration);
      await this.keyAction?.showOk();
      await this.flashSaved();
    } catch (error) {
      streamDeck.logger.error(`saveClip failed: ${describeError(error)}`);
      await this.keyAction?.showAlert();
    }
  }

  private async refreshState(): Promise<void> {
    const client = this.client;
    if (!client) {
      return;
    }

    try {
      const state = await client.getState();
      this.lastState = state;
      await this.render(state);
    } catch (error) {
      streamDeck.logger.error(`refreshState (clip) failed: ${describeError(error)}`);
      await this.setImage("offline");
    }
  }

  private async render(state: MuxlyveState): Promise<void> {
    await this.setImage(state.recorder.active ? "idle" : "disabled");
  }

  private async flashSaved(): Promise<void> {
    await this.setImage("on");
    setTimeout(() => {
      void this.render(this.lastState as MuxlyveState);
    }, FLASH_DURATION_MS);
  }

  private async setImage(variant: string): Promise<void> {
    await this.keyAction?.setImage(`imgs/actions/clip/${variant}.png`);
  }
}

@action({ UUID: "com.blackraken.muxlyve.streamdeck.toggle.fullrecord" })
export class ToggleFullRecordAction extends SingletonAction<NetworkSettings> {
  private client?: MuxlyveClient;
  private lastState?: MuxlyveState;
  private keyAction?: KeyAction<NetworkSettings>;

  constructor() {
    super();
    setInterval(() => {
      void this.refreshState(false);
    }, 2500);
  }

  onWillAppear(ev: WillAppearEvent<NetworkSettings>): void | Promise<void> {
    if (!ev.action.isKey()) {
      return;
    }
    this.keyAction = ev.action;
    this.applySettings(ev.payload.settings ?? {});
  }

  onDidReceiveSettings(ev: DidReceiveSettingsEvent<NetworkSettings>): void | Promise<void> {
    if (!ev.action.isKey()) {
      return;
    }
    this.keyAction = ev.action;
    this.applySettings(ev.payload.settings ?? {});
  }

  onKeyDown(ev: KeyDownEvent<NetworkSettings>): void | Promise<void> {
    this.keyAction = ev.action;
    void this.toggleFullRecord();
  }

  private applySettings(settings: NetworkSettings): void {
    this.client = buildClient(settings);
    void this.refreshState(true);
  }

  private async toggleFullRecord(): Promise<void> {
    const client = this.client;
    if (!client) {
      await this.keyAction?.showAlert();
      return;
    }

    try {
      const current = this.lastState ?? (await client.getState());
      const updated = current.fullRecorder.active
        ? await client.stopFullRecording()
        : await client.startFullRecording();
      this.lastState = updated;
      await this.render(updated);
      await this.keyAction?.showOk();
    } catch (error) {
      streamDeck.logger.error(`toggleFullRecord failed: ${describeError(error)}`);
      await this.keyAction?.showAlert();
      await this.setImage("offline");
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
      await this.render(state);
    } catch (error) {
      streamDeck.logger.error(`refreshState (fullrecord) failed: ${describeError(error)}`);
      if (forceRender || !this.lastState) {
        await this.setImage("offline");
      }
    }
  }

  private async render(state: MuxlyveState): Promise<void> {
    await this.setImage(state.fullRecorder.active ? "on" : "off");
  }

  private async setImage(variant: string): Promise<void> {
    await this.keyAction?.setImage(`imgs/actions/fullrecord/${variant}.png`);
  }
}
