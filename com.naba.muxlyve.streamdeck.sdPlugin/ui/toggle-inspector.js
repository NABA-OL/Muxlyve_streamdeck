const $ = (id) => document.getElementById(id);

let settings = { platform: "twitch", port: 19080 };

function persist() {
  const platform = $("platform").value;
  const port = parseInt($("port").value, 10) || 19080;
  settings = { platform, port };
  window.op ? null : null;
  if (window.__sdInspector && window.__sdInspector.setSettings) {
    window.__sdInspector.setSettings(settings);
  }
}

$("platform").addEventListener("change", persist);
$("port").addEventListener("change", persist);

if (window.connectElgatoStreamDeckSocket) {
  const original = window.connectElgatoStreamDeckSocket;
  window.connectElgatoStreamDeckSocket = function (port, uuid, registerEvent, inInfo) {
    original(port, uuid, registerEvent, inInfo);
    window.__sdInspector = {
      setSettings: (s) => {
        const msg = { event: "setSettings", context: uuid, payload: s };
        window.op ? null : null;
      },
    };
  };
}

window.addEventListener("message", (e) => {
  const data = e.data;
  if (data && data.event === "didReceiveSettings" && data.payload) {
    settings = data.payload;
    $("platform").value = settings.platform || "twitch";
    $("port").value = settings.port || 19080;
  }
});

if (settings) {
  $("platform").value = settings.platform || "twitch";
  $("port").value = settings.port || 19080;
}
