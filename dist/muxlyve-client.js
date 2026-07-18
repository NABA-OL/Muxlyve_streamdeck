export class MuxlyveClient {
    port;
    host;
    constructor(port = 19080, host = "127.0.0.1") {
        this.port = port;
        this.host = host;
    }
    getBaseUrl() {
        return `http://${this.host}:${this.port}`;
    }
    async getState() {
        const response = await fetch(`${this.getBaseUrl()}/api/state`);
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        return (await response.json());
    }
    async toggleDestination(destination) {
        const payload = {
            name: destination.name,
            url: destination.url,
            enabled: !destination.enabled,
        };
        const response = await fetch(`${this.getBaseUrl()}/api/destinations`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        return (await response.json());
    }
}
