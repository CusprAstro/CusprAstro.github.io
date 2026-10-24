"use strict";
let deferredInstallPrompt = null;
function pwaBanner(message, action, handler) {
  const el = document.getElementById("pwa-banner");
  if (!el) return;
  el.innerHTML = `<span>${esc(message)}</span>${action ? `<button class="btn sm">${esc(action)}</button>` : ""}<button class="pwa-close" aria-label="Dismiss">×</button>`;
  el.hidden = false;
  const actionButton = el.querySelector(".btn");
  if (actionButton && handler) actionButton.onclick = handler;
  el.querySelector(".pwa-close").onclick = () => { el.hidden = true; };
}
function initPwa() {
  const install = document.getElementById("install-app");
  window.addEventListener("beforeinstallprompt", e => {
    e.preventDefault();
    deferredInstallPrompt = e;
    if (install) install.hidden = false;
  });
  if (install) install.onclick = async () => {
    if (!deferredInstallPrompt) {
      pwaBanner(/Android/i.test(navigator.userAgent) ? "In Chrome, open the menu and choose Add to Home screen." : "Use your browser's Install app command to install Cuspr.", "", null);
      return;
    }
    deferredInstallPrompt.prompt();
    await deferredInstallPrompt.userChoice;
    deferredInstallPrompt = null;
    install.hidden = true;
  };
  window.addEventListener("appinstalled", () => pwaBanner("Cuspr is installed and ready for offline use.", "", null));
  if (!navigator.onLine) pwaBanner("Offline mode: saved profiles, charts and cached planner data remain available.", "", null);
  window.addEventListener("offline", () => pwaBanner("You are offline. Network features and license revalidation will resume when connected.", "", null));
  window.addEventListener("online", () => pwaBanner("Back online.", "", null));
  if ("serviceWorker" in navigator && /^https?:$/.test(location.protocol)) {
    navigator.serviceWorker.register("./sw.js").then(reg => {
      reg.addEventListener("updatefound", () => {
        const worker = reg.installing;
        if (!worker) return;
        worker.addEventListener("statechange", () => {
          if (worker.state === "installed" && navigator.serviceWorker.controller) {
            pwaBanner("A new Cuspr version is ready.", "Update", () => {
              worker.postMessage({type: "SKIP_WAITING"});
            });
          }
        });
      });
    }).catch(() => pwaBanner("Offline installation is unavailable in this browser session.", "", null));
    let refreshed = false;
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (!refreshed) { refreshed = true; location.reload(); }
    });
  }
}
document.addEventListener("DOMContentLoaded", initPwa);
