export interface IElectronAPI {
  getSetting: (key: string) => Promise<string>;
  setSetting: (key: string, value: string) => Promise<void>;
  getProviders: () => Promise<Provider[]>;
  addProvider: (provider: Provider) => Promise<void>;
  getMcpServers: () => Promise<McpConfig[]>;
  addMcpServer: (server: McpConfig) => Promise<void>;
}

export type McpConfig = Record<string, ServerConfig>;

export interface ServerConfig {
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
