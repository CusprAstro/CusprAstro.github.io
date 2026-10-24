const {app, BrowserWindow, shell, Menu, ipcMain, net} = require("electron");
const path = require("path");

const FEED_HOSTS = ["theastrologypodcast.com", "cafeastrology.com", "www.astrologicalassociation.com", "www.keplercollege.org", "www.astrologers.com", "astrologyking.com"];
const GUMROAD_PRODUCTS = new Set(["B2HpRnlL66EA931sJ9xOlg==", "S0wa78i_Tu7s5_A65WTrPg=="]);
ipcMain.handle("fetch-text", async (e, url) => {
  const u = new URL(url);
  if (u.protocol !== "https:" || !FEED_HOSTS.includes(u.hostname)) throw new Error("blocked");
  const r = await net.fetch(url, {headers: {"User-Agent": "Mozilla/5.0 HalleyAstro"}, signal: AbortSignal.timeout(15000)});
  if (!r.ok) throw new Error("HTTP " + r.status);
  return await r.text();
});
ipcMain.handle("verify-gumroad", async (e, input) => {
  const productId = input && String(input.productId || "");
  const licenseKey = input && String(input.licenseKey || "").trim();
  if (!GUMROAD_PRODUCTS.has(productId) || !licenseKey || licenseKey.length > 500) throw new Error("Invalid Gumroad verification request");
  const body = new URLSearchParams({product_id: productId, license_key: licenseKey, increment_uses_count: "false"});
  const r = await net.fetch("https://api.gumroad.com/v2/licenses/verify", {
    method: "POST", headers: {"Content-Type": "application/x-www-form-urlencoded"}, body: body.toString(), signal: AbortSignal.timeout(15000),
  });
  if (!r.ok) throw new Error("Gumroad verification returned HTTP " + r.status);
  return r.json();
});

function create() {
  const w = new BrowserWindow({
    width: 1400, height: 900, minWidth: 360, minHeight: 560,
    title: "Cuspr", icon: path.join(__dirname, "icon.png"), backgroundColor: "#070b1f",
    webPreferences: {contextIsolation: true, sandbox: true, preload: path.join(__dirname, "preload.js")},
  });
  Menu.setApplicationMenu(null);
  w.loadFile(path.join(__dirname, "index.html"));
  const openExternal = url => {
    try { const u = new URL(url); if (["https:", "mailto:"].includes(u.protocol)) shell.openExternal(url); } catch (e) {}
  };
  w.webContents.setWindowOpenHandler(({url}) => { openExternal(url); return {action: "deny"}; });
  w.webContents.on("will-navigate", (e, url) => { if (!url.startsWith("file:")) { e.preventDefault(); openExternal(url); } });
}
app.whenReady().then(create);
app.on("window-all-closed", () => app.quit());
