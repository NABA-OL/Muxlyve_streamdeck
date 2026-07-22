import streamDeck from "@elgato/streamdeck";
import {
  KickToggleDestinationAction,
  TikTokToggleDestinationAction,
  TwitchToggleDestinationAction,
  YoutubeToggleDestinationAction,
} from "./actions/toggle-destination.js";
import { SaveClipAction, ToggleBufferAction } from "./actions/recorder.js";

streamDeck.logger.info("Muxlyve Stream Deck plugin started");
streamDeck.actions.registerAction(new TwitchToggleDestinationAction());
streamDeck.actions.registerAction(new YoutubeToggleDestinationAction());
streamDeck.actions.registerAction(new KickToggleDestinationAction());
streamDeck.actions.registerAction(new TikTokToggleDestinationAction());
streamDeck.actions.registerAction(new ToggleBufferAction());
streamDeck.actions.registerAction(new SaveClipAction());

await streamDeck.connect();
