export interface IElectronAPI {
  // settings methods
  getSetting: (key: string) => Promise<string>;
  setSetting: (key: string, value: string) => Promise<void>;
  // provider methods
  getProviders: () => Promise<Provider[]>;
  addProvider: (provider: Provider) => Promise<void>;
  deleteProvider: (name: string) => Promise<void>;
  // mcp methods
  getMcpServers: () => Promise<McpConfig[]>;
  addMcpServer: (server: McpConfig) => Promise<void>;
}

export interface McpConfig {
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
