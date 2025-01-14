import { contextBridge, ipcRenderer } from "electron";
import { ServerConfig, Provider, Message } from "./types";

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
  updateProvider: (data: Provider) => {
    return ipcRenderer.invoke("update-provider", data);
  },
  selectProvider: (provider: Provider) => {
    return ipcRenderer.invoke("select-provider", provider);
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
  updateServer: (data: ServerConfig) => {
    return ipcRenderer.invoke("update-server", data);
  },
  enableServer: (id: number) => {
    return ipcRenderer.invoke("enable-server", id);
  },
  disableServer: (id: number) => {
    return ipcRenderer.invoke("disable-server", id);
  },
  installServer: (serverId: number) => {
    return ipcRenderer.invoke("install-server", serverId);
  },
  startServer: (serverId: number) => {
    return ipcRenderer.invoke("start-server", serverId);
  },

  //chat methods
  chat: (data: Message[]) => {
    return ipcRenderer.invoke("chat", data);
  },

  // window methods
  // send() is for one-way communication, invoke() returns a promise
  minimizeWindow: () => ipcRenderer.send("window-minimize"),
  maximizeWindow: () => ipcRenderer.send("window-maximize"),
  closeWindow: () => ipcRenderer.send("window-close"),
});
