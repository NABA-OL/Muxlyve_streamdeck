import StreamDeck from "@elgato/streamdeck";
import { KickToggleDestinationAction, TikTokToggleDestinationAction, TwitchToggleDestinationAction, YoutubeToggleDestinationAction, } from "./actions/toggle-destination.js";
const streamDeck = StreamDeck;
async function main() {
    streamDeck.logger.info("Muxlyve Stream Deck plugin started");
    streamDeck.actions.registerAction(new TwitchToggleDestinationAction(streamDeck));
    streamDeck.actions.registerAction(new YoutubeToggleDestinationAction(streamDeck));
    streamDeck.actions.registerAction(new KickToggleDestinationAction(streamDeck));
    streamDeck.actions.registerAction(new TikTokToggleDestinationAction(streamDeck));
    await streamDeck.connect();
}
void main();
