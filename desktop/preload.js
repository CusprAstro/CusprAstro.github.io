const {contextBridge, ipcRenderer} = require("electron");
contextBridge.exposeInMainWorld("halleyNative", {
  fetchText: url => ipcRenderer.invoke("fetch-text", url),
  verifyGumroad: input => ipcRenderer.invoke("verify-gumroad", input),
});
