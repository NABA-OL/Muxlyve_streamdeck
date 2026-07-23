import streamDeck, {
  action,
  SingletonAction,
  type DidReceiveSettingsEvent,
  type KeyAction,
  type KeyDownEvent,
  type WillAppearEvent,
} from "@elgato/streamdeck";
import { MuxlyveClient, MuxlyveState } from "../muxlyve-client.js";
import {
  buildClient,
  describeError,
  normalizeDuration,
  ConnectivityLog,
  type NetworkSettings,
  type RecorderDuration,
} from "./shared.js";

type BufferSettings = NetworkSettings & {
  duration?: string;
};

const FLASH_DURATION_MS = 800;

@action({ UUID: "com.blackraken.muxlyve.streamdeck.toggle.buffer" })
export class ToggleBufferAction extends SingletonAction<BufferSettings> {
  private client?: MuxlyveClient;
  private lastState?: MuxlyveState;
  private keyAction?: KeyAction<BufferSettings>;
  private readonly connectivity = new ConnectivityLog();

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
      const updated = current.recorder.armed ? await client.stopRecording() : await client.startRecording(duration);
      this.lastState = updated;
      this.connectivity.reportSuccess(streamDeck.logger, "[buffer] connection restored");
      await this.render(updated);
      await this.keyAction?.showOk();
    } catch (error) {
      this.connectivity.reportFailure(streamDeck.logger, `[buffer] toggleBuffer failed: ${describeError(error)}`);
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
      this.connectivity.reportSuccess(streamDeck.logger, "[buffer] connection restored");
      await this.render(state);
    } catch (error) {
      this.connectivity.reportFailure(streamDeck.logger, `[buffer] refreshState failed: ${describeError(error)}`);
      if (forceRender || !this.lastState) {
        await this.setImage("offline");
      }
    }
  }

  private async render(state: MuxlyveState): Promise<void> {
    await this.setImage(state.recorder.armed ? "on" : "off");
  }

  private async setImage(variant: string): Promise<void> {
    await this.keyAction?.setImage(`imgs/actions/buffer/${variant}.png`);
  }
}

type ClipSettings = NetworkSettings;

@action({ UUID: "com.blackraken.muxlyve.streamdeck.save.clip" })
export class SaveClipAction extends SingletonAction<ClipSettings> {
  private client?: MuxlyveClient;
  private lastState?: MuxlyveState;
  private keyAction?: KeyAction<ClipSettings>;
  private readonly connectivity = new ConnectivityLog();

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
    void this.saveClip();
  }

  private applySettings(settings: ClipSettings): void {
    this.client = buildClient(settings);
    void this.refreshState();
  }

  private async saveClip(): Promise<void> {
    const client = this.client;
    if (!client) {
      await this.keyAction?.showAlert();
      return;
    }

    try {
      await client.saveClip();
      this.connectivity.reportSuccess(streamDeck.logger, "[clip] connection restored");
      await this.keyAction?.showOk();
      await this.flashSaved();
    } catch (error) {
      this.connectivity.reportFailure(streamDeck.logger, `[clip] saveClip failed: ${describeError(error)}`);
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
      this.connectivity.reportSuccess(streamDeck.logger, "[clip] connection restored");
      await this.render(state);
    } catch (error) {
      this.connectivity.reportFailure(streamDeck.logger, `[clip] refreshState failed: ${describeError(error)}`);
      await this.setImage("offline");
    }
  }

  private async render(state: MuxlyveState): Promise<void> {
    await this.setImage(state.recorder.armed ? "idle" : "disabled");
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
  private readonly connectivity = new ConnectivityLog();

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
      const updated = current.fullRecorder.armed
        ? await client.stopFullRecording()
        : await client.startFullRecording();
      this.lastState = updated;
      this.connectivity.reportSuccess(streamDeck.logger, "[fullrecord] connection restored");
      await this.render(updated);
      await this.keyAction?.showOk();
    } catch (error) {
      this.connectivity.reportFailure(
        streamDeck.logger,
        `[fullrecord] toggleFullRecord failed: ${describeError(error)}`,
      );
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
      this.connectivity.reportSuccess(streamDeck.logger, "[fullrecord] connection restored");
      await this.render(state);
    } catch (error) {
      this.connectivity.reportFailure(
        streamDeck.logger,
        `[fullrecord] refreshState failed: ${describeError(error)}`,
      );
      if (forceRender || !this.lastState) {
        await this.setImage("offline");
      }
    }
  }

  private async render(state: MuxlyveState): Promise<void> {
    await this.setImage(state.fullRecorder.armed ? "on" : "off");
  }

  private async setImage(variant: string): Promise<void> {
    await this.keyAction?.setImage(`imgs/actions/fullrecord/${variant}.png`);
  }
}
