import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";

export interface IElectronAPI {
  // settings methods
  getSetting: (key: string) => Promise<string>;
  setSetting: (key: string, value: string) => Promise<void>;
  // provider methods
  getProviders: () => Promise<Provider[]>;
  addProvider: (provider: Provider) => Promise<void>;
  deleteProvider: (id: number) => Promise<void>;
  updateProvider: (data: Provider) => Promise<void>;
  selectProvider: (provider: Provider) => Promise<void>;
  // mcp methods
  getServers: () => Promise<ServerConfig[]>;
  addServer: (server: ServerConfig) => Promise<void>;
  deleteServer: (id: number) => Promise<void>;
  updateServer: (data: ServerConfig) => Promise<void>;
  // chat methods
  chat: (data: Message[]) => Promise<string>;
  minimizeWindow: () => void;
  maximizeWindow: () => void;
  closeWindow: () => void;
  //server commands
  enableServer: (id: number) => void;
  disableServer: (id: number) => void;
}

export interface ServerConfig {
  id?: number;
  name: string;
  description?: string;
  command: string;
  args: string[];
  enabled?: boolean;
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

export interface Message {
  role: "user" | "assistant";
  content: string | Anthropic.ContentBlock[];
}

export type ProviderClient =
  | {
      type: "openai";
      client: OpenAI;
    }
  | {
      type: "anthropic";
      client: Anthropic;
    };

export interface PromptTemplate {
  name: string;
  description?: string;
  arguments?: PromptTemplateArguments;
}

export interface PromptTemplateArguments {
  name: string;
  description?: string;
  required?: boolean;
}

declare global {
  interface Window {
    electron: IElectronAPI;
  }
}
