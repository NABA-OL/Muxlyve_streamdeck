let websocket = null;
let uuid = null;
let inInfo = null;
let settings = { platform: "twitch", port: 19080 };

const $ = (id) => document.getElementById(id);

function connectElgatoStreamDeckSocket(inPort, inUuid, inRegisterEvent, inInfoStr) {
  uuid = inUuid;
  inInfo = JSON.parse(inInfoStr);
  websocket = new WebSocket("ws://127.0.0.1:" + inPort);

  websocket.onopen = () => {
    const json = {
      event: inRegisterEvent,
      uuid: uuid,
    };
    websocket.send(JSON.stringify(json));

    const getSettings = { event: "getSettings", context: uuid };
    websocket.send(JSON.stringify(getSettings));
  };

  websocket.onmessage = (ev) => {
    const json = JSON.parse(ev.data);
    if (json.event === "didReceiveSettings" && json.payload) {
      settings = { ...settings, ...json.payload.settings };
      applyToForm();
    }
  };
}

function applyToForm() {
  $("platform").value = settings.platform || "twitch";
  $("port").value = settings.port || 19080;
}

function persist() {
  settings = {
    platform: $("platform").value,
    port: parseInt($("port").value, 10) || 19080,
  };
  if (websocket && uuid) {
    websocket.send(
      JSON.stringify({ event: "setSettings", context: uuid, payload: settings })
    );
  }
}

$("platform").addEventListener("change", persist);
$("port").addEventListener("change", persist);
applyToForm();

window.connectElgatoStreamDeckSocket = connectElgatoStreamDeckSocket;
