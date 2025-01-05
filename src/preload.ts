import { contextBridge, ipcRenderer } from "electron";
import { ServerConfig, Provider, ChatRequest } from "./types";

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
    return ipcRenderer.invoke("add-provider", provider);
  },
  deleteProvider: (id: number) => {
    return ipcRenderer.invoke("delete-provider", id);
  },

  //mcp server methods
  getServers: () => {
    return ipcRenderer.invoke("get-servers");
  },
  addServer: (server: ServerConfig) => {
    return ipcRenderer.invoke("add-server", server);
  },
  deleteServer: (id: number) => {
    return ipcRenderer.invoke("delete-server", id);
  },
  //chat methods
  chat: (data: ChatRequest) => {
    return ipcRenderer.invoke("chat", data);
  },
});
