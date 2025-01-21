import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";

// always returns a promise since the IPC communication is async even if the underlying implementation is synchronous
export interface IElectronAPI {
  // settings methods
  getSetting: (key: string) => Promise<string>;
  setSetting: (key: string, value: string) => Promise<void>;
  // User methods
  setUser: (user: User) => Promise<void>;
  getUser: () => Promise<User>;
  // provider methods
  getProviders: () => Promise<Provider[]>;
  addProvider: (provider: Provider) => Promise<void>;
  deleteProvider: (id: number) => Promise<void>;
  updateProvider: (data: Provider) => Promise<void>;
  selectProvider: (provider: Provider) => Promise<void>;
  // mcp methods
  getServers: () => Promise<ServerConfig[]>;
  addServer: (server: ServerConfig) => Promise<number>;
  deleteServer: (id: number) => Promise<void>;
  updateServer: (data: ServerConfig) => Promise<void>;
  installServer: (serverId: number) => Promise<void>;
  startServer: (serverId: number) => Promise<void>;
  stopServer: (serverId: number) => Promise<void>;
  //conversation methods
  createConversation: () => Promise<number>;
  deleteConversation: (id: number) => Promise<void>;
  // chat methods
  chat: (data: Message[]) => Promise<string>;
  minimizeWindow: () => void;
  maximizeWindow: () => void;
  closeWindow: () => void;
}

export interface ServerConfig {
  id?: number;
  name: string;
  description?: string;
  installType: string; //"npm" | "pip" | "binary" | "uv";
  package: string;
  startCommand?: string;
  args: string[];
  version?: string;
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

export interface Conversation {
  id?: number;
  providerId: number;
  title: string;
  createdAt: string;
  parent_conversation_id: number;
}

export interface User {
  id?: number;
  name: string;
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
