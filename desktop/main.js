const {app, BrowserWindow, shell, Menu, ipcMain, net} = require("electron");
const path = require("path");

const FEED_HOSTS = ["theastrologypodcast.com", "cafeastrology.com", "www.astrologicalassociation.com", "www.keplercollege.org", "www.astrologers.com", "astrologyking.com"];
const GUMROAD_PRODUCTS = new Set(["S0wa78i_Tu7s5_A65WTrPg==", "B2HpRnlL66EA931sJ9xOlg=="]);
ipcMain.handle("fetch-text", async (e, url) => {
  const u = new URL(url);
  if (u.protocol !== "https:" || !FEED_HOSTS.includes(u.hostname)) throw new Error("blocked");
  const r = await net.fetch(url, {headers: {"User-Agent": "Cuspr/0.3"}, signal: AbortSignal.timeout(15000)});
  if (!r.ok) throw new Error("HTTP " + r.status);
  return await r.text();
});
ipcMain.handle("gumroad-verify", async (e, input) => {
  const productId = String(input && input.productId || "");
  const licenseKey = String(input && input.licenseKey || "").trim();
  if (!GUMROAD_PRODUCTS.has(productId) || licenseKey.length < 4 || licenseKey.length > 500) throw new Error("Invalid license request.");
  const body = new URLSearchParams({product_id:productId,license_key:licenseKey,increment_uses_count:"false"});
  const response = await net.fetch("https://api.gumroad.com/v2/licenses/verify", {
    method:"POST", headers:{"Content-Type":"application/x-www-form-urlencoded","User-Agent":"Cuspr/0.3"},
    body:body.toString(), signal:AbortSignal.timeout(15000)
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok && !data.message) data.message = `Gumroad returned HTTP ${response.status}.`;
  return data;
});

function openExternal(url) {
  try {
    const u = new URL(url);
    if (u.protocol === "https:" || u.protocol === "mailto:") shell.openExternal(u.toString());
  } catch (e) {}
}

function create() {
  const w = new BrowserWindow({
    width: 1400, height: 900, minWidth: 360, minHeight: 600,
    title: "Cuspr", icon: path.join(__dirname, "generated", "icon.png"), backgroundColor: "#070b1f",
    webPreferences: {contextIsolation: true, sandbox: true, preload: path.join(__dirname, "preload.js")},
  });
  Menu.setApplicationMenu(null);
  w.loadFile(path.join(__dirname, "generated", "index.html"));
  w.webContents.setWindowOpenHandler(({url}) => { openExternal(url); return {action: "deny"}; });
  w.webContents.on("will-navigate", (e, url) => { if (!url.startsWith("file:")) { e.preventDefault(); openExternal(url); } });
}
app.whenReady().then(create);
app.on("window-all-closed", () => app.quit());
