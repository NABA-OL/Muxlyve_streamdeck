import streamDeck from "@elgato/streamdeck";
import {
  TwitchToggleAction,
  YouTubeToggleAction,
  KickToggleAction,
  TikTokToggleAction,
} from "./actions/toggle-destination.js";

streamDeck.logger.info("Muxlyve Stream Deck plugin starting");

streamDeck.actions.registerAction(new TwitchToggleAction());
streamDeck.actions.registerAction(new YouTubeToggleAction());
streamDeck.actions.registerAction(new KickToggleAction());
streamDeck.actions.registerAction(new TikTokToggleAction());

streamDeck.connect();
