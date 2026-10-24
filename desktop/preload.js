const {contextBridge, ipcRenderer} = require("electron");
contextBridge.exposeInMainWorld("cusprNative", {
  fetchText: url => ipcRenderer.invoke("fetch-text", url),
  verifyGumroad: input => ipcRenderer.invoke("gumroad-verify", input)
});
