import { contextBridge, ipcRenderer } from "electron";
import { McpConfig, Provider } from "./types";

contextBridge.exposeInMainWorld("electron", {
  // settings methods
  getSetting: (key: string) => ipcRenderer.invoke("db-get-setting", key),
  setSetting: (key: string, value: string) =>
    ipcRenderer.invoke("db-set-setting", key, value),

  // provider methods
  getProviders: () => ipcRenderer.invoke("get-providers"),
  addProvider: (provider: Provider) =>
    ipcRenderer.invoke("add-provider", provider),
  deleteProvider: (name: string) => {
    ipcRenderer.invoke("delete-provider", name);
  },

  //mcp server methods
  getMcpServers: () => ipcRenderer.invoke("get-mcp-servers"),
  addMcpServer: (server: McpConfig) =>
    ipcRenderer.invoke("add-mcp-server", server),
});
