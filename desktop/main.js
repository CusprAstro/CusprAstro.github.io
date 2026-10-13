const {app, BrowserWindow, shell, Menu, ipcMain, net} = require("electron");
const path = require("path");

const FEED_HOSTS = ["theastrologypodcast.com", "cafeastrology.com", "www.astrologicalassociation.com", "www.keplercollege.org", "www.astrologers.com", "astrologyking.com"];
ipcMain.handle("fetch-text", async (e, url) => {
  const u = new URL(url);
  if (u.protocol !== "https:" || !FEED_HOSTS.includes(u.hostname)) throw new Error("blocked");
  const r = await net.fetch(url, {headers: {"User-Agent": "Mozilla/5.0 HalleyAstro"}, signal: AbortSignal.timeout(15000)});
  if (!r.ok) throw new Error("HTTP " + r.status);
  return await r.text();
});

function create() {
  const w = new BrowserWindow({
    width: 1400, height: 900, minWidth: 900, minHeight: 600,
    title: "Cuspr", icon: path.join(__dirname, "icon.png"), backgroundColor: "#070b1f",
    webPreferences: {contextIsolation: true, sandbox: true, preload: path.join(__dirname, "preload.js")},
  });
  Menu.setApplicationMenu(null);
  w.loadFile(path.join(__dirname, "index.html"));
  w.webContents.setWindowOpenHandler(({url}) => { shell.openExternal(url); return {action: "deny"}; });
  w.webContents.on("will-navigate", (e, url) => { if (!url.startsWith("file:")) { e.preventDefault(); shell.openExternal(url); } });
}
app.whenReady().then(create);
app.on("window-all-closed", () => app.quit());
