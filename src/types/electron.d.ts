export interface IElectronAPI {
  loadConfig: () => Promise<McpConfig>;
}

interface McpConfig {
  debug_mode: boolean;
  model: Model;
  message_window: number;
  mcp_servers: ServerConfig[];
}

interface Model {
  name: string;
  config: ModelConfig;
}

interface ModelConfig {
  url: string;
  apikey: string;
}

interface Server {
  [key: string]: ServerConfig;
}

interface ServerConfig {
  command: string;
  args: string[];
}

interface;
declare global {
  interface Window {
    electron: IElectronAPI;
  }
}
