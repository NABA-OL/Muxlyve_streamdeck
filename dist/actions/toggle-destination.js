var __esDecorate = (this && this.__esDecorate) || function (ctor, descriptorIn, decorators, contextIn, initializers, extraInitializers) {
    function accept(f) { if (f !== void 0 && typeof f !== "function") throw new TypeError("Function expected"); return f; }
    var kind = contextIn.kind, key = kind === "getter" ? "get" : kind === "setter" ? "set" : "value";
    var target = !descriptorIn && ctor ? contextIn["static"] ? ctor : ctor.prototype : null;
    var descriptor = descriptorIn || (target ? Object.getOwnPropertyDescriptor(target, contextIn.name) : {});
    var _, done = false;
    for (var i = decorators.length - 1; i >= 0; i--) {
        var context = {};
        for (var p in contextIn) context[p] = p === "access" ? {} : contextIn[p];
        for (var p in contextIn.access) context.access[p] = contextIn.access[p];
        context.addInitializer = function (f) { if (done) throw new TypeError("Cannot add initializers after decoration has completed"); extraInitializers.push(accept(f || null)); };
        var result = (0, decorators[i])(kind === "accessor" ? { get: descriptor.get, set: descriptor.set } : descriptor[key], context);
        if (kind === "accessor") {
            if (result === void 0) continue;
            if (result === null || typeof result !== "object") throw new TypeError("Object expected");
            if (_ = accept(result.get)) descriptor.get = _;
            if (_ = accept(result.set)) descriptor.set = _;
            if (_ = accept(result.init)) initializers.unshift(_);
        }
        else if (_ = accept(result)) {
            if (kind === "field") initializers.unshift(_);
            else descriptor[key] = _;
        }
    }
    if (target) Object.defineProperty(target, contextIn.name, descriptor);
    done = true;
};
var __runInitializers = (this && this.__runInitializers) || function (thisArg, initializers, value) {
    var useValue = arguments.length > 2;
    for (var i = 0; i < initializers.length; i++) {
        value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
    }
    return useValue ? value : void 0;
};
import { action, SingletonAction } from "@elgato/streamdeck";
import { MuxlyveClient } from "../muxlyve-client.js";
class BaseToggleDestinationAction extends SingletonAction {
    streamDeck;
    client;
    lastState;
    context;
    constructor(streamDeck) {
        super();
        this.streamDeck = streamDeck;
        setInterval(() => {
            void this.refreshState(false);
        }, 2500);
    }
    onWillAppear(ev) {
        this.context = ev.context ?? ev.action?.context;
        this.applySettings(ev.payload.settings ?? {});
    }
    onDidReceiveSettings(ev) {
        this.context = ev.context ?? ev.action?.context;
        this.applySettings(ev.payload.settings ?? {});
    }
    onKeyDown(ev) {
        this.context = ev.context ?? ev.action?.context;
        const settings = ev.payload.settings ?? {};
        const platform = this.normalizePlatform(settings.platform) ?? this.defaultPlatform;
        void this.togglePlatform(platform);
    }
    onKeyUp(_ev) {
        // No-op
    }
    applySettings(settings) {
        const platform = this.normalizePlatform(settings.platform) ?? this.defaultPlatform;
        const port = Number.parseInt(settings.panelPort ?? "19080", 10) || 19080;
        this.client = new MuxlyveClient(port);
        void this.refreshState(false);
        void this.setTitle(platform);
        void this.setImageForPlatform(platform, "default");
    }
    async togglePlatform(platform) {
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
        }
        catch {
            await this.showAlert();
            await this.renderOfflineState(platform);
        }
    }
    async refreshState(forceRender) {
        const client = this.client;
        if (!client) {
            return;
        }
        try {
            const state = await client.getState();
            this.lastState = state;
            await this.renderState(this.defaultPlatform, state);
        }
        catch {
            if (forceRender || !this.lastState) {
                await this.renderOfflineState(this.defaultPlatform);
            }
        }
    }
    async renderState(platform, state) {
        const destination = state.destinations.find((item) => this.matchesPlatform(item.name, platform));
        if (!destination) {
            await this.showDisabledState(platform, "no-configured");
            return;
        }
        const variant = this.getVisualState(destination, state.live);
        await this.setImageForPlatform(platform, variant);
        await this.setTitle(platform);
    }
    async renderOfflineState(platform) {
        await this.showDisabledState(platform, "offline");
    }
    async showDisabledState(platform, reason) {
        await this.setImageForPlatform(platform, reason === "offline" ? "offline" : "disabled");
        await this.setTitle(platform);
    }
    async setTitle(platform) {
        const label = platform.charAt(0).toUpperCase() + platform.slice(1);
        await this.streamDeck.client.setTitle(this.context ?? "", label);
    }
    async setImageForPlatform(platform, variant = "default") {
        const imagePath = this.resolveImagePath(platform, variant);
        await this.streamDeck.client.setImage(this.context ?? "", imagePath);
    }
    resolveImagePath(platform, variant) {
        const normalized = platform.toLowerCase();
        return `./imgs/actions/${normalized}/${variant}.png`;
    }
    getVisualState(destination, live) {
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
    normalizePlatform(value) {
        const normalized = (value ?? "").trim().toLowerCase();
        if (["twitch", "youtube", "kick", "tiktok"].includes(normalized)) {
            return normalized;
        }
        return this.defaultPlatform;
    }
    matchesPlatform(name, platform) {
        return name.trim().toLowerCase() === platform.toLowerCase();
    }
    async showAlert() {
        await this.streamDeck.client.showAlert(this.context ?? "");
    }
    async showOk() {
        await this.streamDeck.client.showOk(this.context ?? "");
    }
}
let TwitchToggleDestinationAction = (() => {
    let _classDecorators = [action({ UUID: "com.blackraken.muxlyve.streamdeck.toggle.twitch" })];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = BaseToggleDestinationAction;
    var TwitchToggleDestinationAction = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            TwitchToggleDestinationAction = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        defaultPlatform = "twitch";
    };
    return TwitchToggleDestinationAction = _classThis;
})();
export { TwitchToggleDestinationAction };
let YoutubeToggleDestinationAction = (() => {
    let _classDecorators = [action({ UUID: "com.blackraken.muxlyve.streamdeck.toggle.youtube" })];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = BaseToggleDestinationAction;
    var YoutubeToggleDestinationAction = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            YoutubeToggleDestinationAction = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        defaultPlatform = "youtube";
    };
    return YoutubeToggleDestinationAction = _classThis;
})();
export { YoutubeToggleDestinationAction };
let KickToggleDestinationAction = (() => {
    let _classDecorators = [action({ UUID: "com.blackraken.muxlyve.streamdeck.toggle.kick" })];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = BaseToggleDestinationAction;
    var KickToggleDestinationAction = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            KickToggleDestinationAction = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        defaultPlatform = "kick";
    };
    return KickToggleDestinationAction = _classThis;
})();
export { KickToggleDestinationAction };
let TikTokToggleDestinationAction = (() => {
    let _classDecorators = [action({ UUID: "com.blackraken.muxlyve.streamdeck.toggle.tiktok" })];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = BaseToggleDestinationAction;
    var TikTokToggleDestinationAction = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            TikTokToggleDestinationAction = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        defaultPlatform = "tiktok";
    };
    return TikTokToggleDestinationAction = _classThis;
})();
export { TikTokToggleDestinationAction };
