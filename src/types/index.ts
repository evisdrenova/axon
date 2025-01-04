export interface IElectronAPI {
  // settings methods
  getSetting: (key: string) => Promise<string>;
  setSetting: (key: string, value: string) => Promise<void>;
  // provider methods
  getProviders: () => Promise<Provider[]>;
  addProvider: (provider: Provider) => Promise<void>;
  deleteProvider: (id: number) => Promise<void>;
  // mcp methods
  getServers: () => Promise<ServerConfig[]>;
  addServer: (server: ServerConfig) => Promise<void>;
  deleteServer: (id: number) => Promise<void>;
}

export interface ServerConfig {
  id?: number;
  name: string;
  command: string;
  args: string[];
}

export interface Provider {
  id?: number;
  name: string;
  base_url: string;
  api_key: string;
}

declare global {
  interface Window {
    electron: IElectronAPI;
  }
}
