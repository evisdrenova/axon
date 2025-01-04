import { contextBridge, ipcRenderer } from "electron";
import { McpConfig, Provider } from "./types";

contextBridge.exposeInMainWorld("electron", {
  // settings methods
  getSetting: (key: string) => {
    return ipcRenderer.invoke("db-get-setting", key);
  },
  setSetting: (key: string, value: string) => {
    return ipcRenderer.invoke("db-set-setting", key, value);
  },

  // provider methods
  getProviders: () => {
    return ipcRenderer.invoke("get-providers");
  },
  addProvider: (provider: Provider) => {
    return;
    ipcRenderer.invoke("add-provider", provider);
  },
  deleteProvider: (id: number) => {
    return ipcRenderer.invoke("delete-provider", id);
  },

  //mcp server methods
  getMcpServers: () => {
    return ipcRenderer.invoke("get-mcp-servers");
  },
  addMcpServer: (server: McpConfig) => {
    return ipcRenderer.invoke("add-mcp-server", server);
  },
});
