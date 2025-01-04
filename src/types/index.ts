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
  // chat methods
  chat: (data: {
    provider: Provider;
    messages: any[];
    message: string;
  }) => Promise<string>;
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
  type: string;
  baseUrl: string;
  apiPath: string;
  apiKey: string;
  model: string;
  config: string;
}

declare global {
  interface Window {
    electron: IElectronAPI;
  }
}
