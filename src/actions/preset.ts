import streamDeck, {
  action,
  SingletonAction,
  type DidReceiveSettingsEvent,
  type KeyAction,
  type KeyDownEvent,
  type SendToPluginEvent,
  type WillAppearEvent,
  type WillDisappearEvent,
} from "@elgato/streamdeck";
import type { JsonValue } from "@elgato/utils";
import { MuxlyveClient, PresetInfo } from "../muxlyve-client.js";
import { buildClient, describeError, ConnectivityLog, type NetworkSettings } from "./shared.js";

type PresetSettings = NetworkSettings & {
  presetName?: string;
};

interface InstanceState {
  client: MuxlyveClient;
  keyAction: KeyAction<PresetSettings>;
  connectivity: ConnectivityLog;
  lastPresets?: PresetInfo[];
  pollTimer: ReturnType<typeof setInterval>;
}

const POLL_INTERVAL_MS = 2500;

@action({ UUID: "com.blackraken.muxlyve.streamdeck.preset" })
export class PresetAction extends SingletonAction<PresetSettings> {
  // Estado por instancia de botón (ev.action.id) — NUNCA como campo de la clase.
  // Esta clase respalda todos los botones "Perfil" a la vez; si el estado runtime
  // viviera en `this.algo`, dos botones de perfil distintos se pisarían entre sí.
  private readonly instances = new Map<string, InstanceState>();

  onWillAppear(ev: WillAppearEvent<PresetSettings>): void | Promise<void> {
    if (!ev.action.isKey()) {
      return;
    }
    this.setupInstance(ev.action, ev.payload.settings ?? {});
  }

  onWillDisappear(ev: WillDisappearEvent<PresetSettings>): void {
    const instance = this.instances.get(ev.action.id);
    if (instance) {
      clearInterval(instance.pollTimer);
    }
    this.instances.delete(ev.action.id);
  }

  onDidReceiveSettings(ev: DidReceiveSettingsEvent<PresetSettings>): void | Promise<void> {
    if (!ev.action.isKey()) {
      return;
    }
    this.setupInstance(ev.action, ev.payload.settings ?? {});
  }

  onKeyDown(ev: KeyDownEvent<PresetSettings>): void | Promise<void> {
    if (!ev.action.isKey()) {
      return;
    }
    void this.togglePreset(ev.action, ev.payload.settings ?? {});
  }

  onSendToPlugin(ev: SendToPluginEvent<JsonValue, PresetSettings>): void | Promise<void> {
    if (!ev.action.isKey()) {
      return;
    }
    const payload = ev.payload as { cmd?: string } | null;
    if (payload?.cmd === "listPresets") {
      void this.sendPresetList(ev.action);
    }
  }

  private setupInstance(keyAction: KeyAction<PresetSettings>, settings: PresetSettings): void {
    const id = keyAction.id;
    const previous = this.instances.get(id);
    if (previous) {
      clearInterval(previous.pollTimer);
    }

    const instance: InstanceState = {
      client: buildClient(settings),
      keyAction,
      connectivity: previous?.connectivity ?? new ConnectivityLog(),
      lastPresets: previous?.lastPresets,
      pollTimer: setInterval(() => void this.poll(id), POLL_INTERVAL_MS),
    };
    this.instances.set(id, instance);
    void this.poll(id, true);
  }

  private async poll(id: string, forceRender = false): Promise<void> {
    const instance = this.instances.get(id);
    if (!instance) {
      return;
    }

    try {
      const presets = await instance.client.getPresets();
      instance.lastPresets = presets;
      instance.connectivity.reportSuccess(streamDeck.logger, `[preset:${id}] connection restored`);
      await this.render(instance);
    } catch (error) {
      instance.connectivity.reportFailure(streamDeck.logger, `[preset:${id}] poll failed: ${describeError(error)}`);
      if (forceRender || !instance.lastPresets) {
        await instance.keyAction.setImage("imgs/actions/preset/offline.png");
      }
    }
  }

  private async togglePreset(keyAction: KeyAction<PresetSettings>, settings: PresetSettings): Promise<void> {
    const instance = this.instances.get(keyAction.id);
    if (!instance) {
      return;
    }

    const presetName = (settings.presetName ?? "").trim();
    if (!presetName) {
      await keyAction.showAlert();
      return;
    }

    const known = instance.lastPresets?.find((preset) => preset.name === presetName);
    if (!known) {
      await keyAction.showAlert();
      return;
    }

    try {
      if (known.active) {
        await instance.client.deactivatePreset(presetName);
      } else {
        await instance.client.applyPreset(presetName);
      }
      streamDeck.logger.info(`[preset:${keyAction.id}] toggled OK -> ${presetName} active=${!known.active}`);
      await keyAction.showOk();
      await this.poll(keyAction.id, true);
    } catch (error) {
      streamDeck.logger.error(`[preset:${keyAction.id}] toggle failed: ${describeError(error)}`);
      await keyAction.showAlert();
    }
  }

  private async sendPresetList(keyAction: KeyAction<PresetSettings>): Promise<void> {
    const instance = this.instances.get(keyAction.id);
    if (!instance) {
      return;
    }

    try {
      const presets = await instance.client.getPresets();
      instance.lastPresets = presets;
      await streamDeck.ui.sendToPropertyInspector({ presets });
    } catch (error) {
      await streamDeck.ui.sendToPropertyInspector({ presets: [], error: describeError(error) });
    }
  }

  private async render(instance: InstanceState): Promise<void> {
    const settings = await instance.keyAction.getSettings();
    const presetName = (settings.presetName ?? "").trim();

    if (!presetName) {
      await instance.keyAction.setTitle("Elegir\nperfil");
      await instance.keyAction.setImage("imgs/actions/preset/unassigned.png");
      return;
    }

    await instance.keyAction.setTitle(presetName);

    const preset = instance.lastPresets?.find((item) => item.name === presetName);
    if (!preset) {
      await instance.keyAction.setImage("imgs/actions/preset/deleted.png");
      return;
    }

    await instance.keyAction.setImage(preset.active ? "imgs/actions/preset/on.png" : "imgs/actions/preset/off.png");
  }
}
