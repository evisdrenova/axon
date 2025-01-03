import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("electron", {
  // settings methods
  getSetting: (key: string) => ipcRenderer.invoke("db-get-setting", key),
  setSetting: (key: string, value: string) =>
    ipcRenderer.invoke("db-set-setting", key, value),

  // provider methods
  getProviders: (key: string) => ipcRenderer.invoke("get-providers", key),
  addProvider: (key: string, value: string) =>
    ipcRenderer.invoke("add-provider", key, value),

  //mcp server methods
  getMcpServers: (key: string) => ipcRenderer.invoke("get-mcp-server", key),
  setMcpServer: (key: string, value: string) =>
    ipcRenderer.invoke("set-mcp-server", key, value),
});
