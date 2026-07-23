import streamDeck from "@elgato/streamdeck";
import {
  KickToggleDestinationAction,
  TikTokToggleDestinationAction,
  TwitchToggleDestinationAction,
  YoutubeToggleDestinationAction,
} from "./actions/toggle-destination.js";
import { SaveClipAction, ToggleBufferAction, ToggleFullRecordAction } from "./actions/recorder.js";

streamDeck.logger.info("Muxlyve Stream Deck plugin started");
streamDeck.actions.registerAction(new TwitchToggleDestinationAction());
streamDeck.actions.registerAction(new YoutubeToggleDestinationAction());
streamDeck.actions.registerAction(new KickToggleDestinationAction());
streamDeck.actions.registerAction(new TikTokToggleDestinationAction());
streamDeck.actions.registerAction(new ToggleBufferAction());
streamDeck.actions.registerAction(new SaveClipAction());
streamDeck.actions.registerAction(new ToggleFullRecordAction());

await streamDeck.connect();
