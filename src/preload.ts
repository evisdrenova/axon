import { contextBridge, ipcRenderer } from "electron";
import { ServerConfig, Provider, Message, User } from "./types";

contextBridge.exposeInMainWorld("electron", {
  // user methods
  setUser: (user: User) => {
    return ipcRenderer.invoke("set-user", user);
  },
  getUser: () => {
    return ipcRenderer.invoke("get-user");
  },
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
  installServer: (serverId: number) => {
    return ipcRenderer.invoke("install-server", serverId);
  },
  startServer: (serverId: number) => {
    return ipcRenderer.invoke("start-server", serverId);
  },
  stopServer: (serverId: number) => {
    return ipcRenderer.invoke("stop-server", serverId);
  },

  // conversation methods
  createConversation: () => {
    return ipcRenderer.invoke("create-conversation");
  },
  deleteConversation: (id: number) => {
    return ipcRenderer.invoke("delete-converaation", id);
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
