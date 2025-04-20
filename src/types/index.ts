import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";
import { SettingsValue } from "../../src/settings/Settings";
import { CoreMessage } from "ai";

// always returns a promise since the IPC communication is async even if the underlying implementation is synchronous
export interface IElectronAPI {
  // settings methods
  getSettings: <T extends SettingsValue>(key: string) => Promise<T | undefined>;
  setSettings: (key: string, value: SettingsValue) => Promise<boolean>;
  getAllSettings: () => Promise<Record<string, SettingsValue>>;
  setMultipleSettings: (
    settings: Record<string, SettingsValue>
  ) => Promise<boolean>;
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
  getConversations: () => Promise<Conversation[]>;
  createConversation: (convo: Partial<Conversation>) => Promise<number>;
  deleteConversation: (id: number) => Promise<void>;
  // message methods
  saveMessage: (message: Message) => Promise<void>;
  saveMessages: (message: Message[]) => Promise<void>;
  deleteMessage: (messageId: number) => Promise<void>;
  updateConversationTitle: (convoId: number, newTitle: string) => Promise<void>;
  getConversationMessages: (convoId: number) => Promise<Message[]>;
  chat: (data: Message[]) => Promise<string>;
  summarizeContext: (data: Message[]) => Promise<string>;
  minimizeWindow: () => void;
  maximizeWindow: () => void;
  closeWindow: () => void;
  loginStart: (username: string) => Promise<{
    user_id: string;
    client_config: {
      api_key: string;
      user_token: string;
      channels: any[];
    };
  }>;
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

export type ProviderClient =
  | {
      type: "openai";
      client: OpenAI;
    }
  | {
      type: "anthropic";
      client: Anthropic;
    };

export interface User {
  id?: number;
  name: string;
}

export interface Message {
  id?: number;
  role: "user" | "assistant";
  content: CoreMessage;
  createdAt?: string;
  conversationId?: number;
}

export interface FileAttachment {
  id: string;
  file: File;
  type: string;
  preview?: string;
}

export interface Conversation {
  id?: number;
  providerId: number;
  title: string;
  parent_conversation_id: number;
  createdAt?: string;
  messages?: Message[];
  summary?: string;
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

// src/types.ts
import { StreamChat, UserResponse } from "stream-chat";

export interface User {
  id?: number;
  name: string;
  image?: string;
  status?: "online" | "offline" | "away";
}

export interface Message {
  id?: number;
  text: string;
  user: User;
  created_at: string;
  updated_at?: string;
  attachments?: Attachment[];
  mentioned_users?: User[];
  thread_count?: number;
  reaction_counts?: Record<string, number>;
}

export interface Attachment {
  type: "image" | "file" | "link";
  title?: string;
  description?: string;
  url: string;
  name?: string;
  size?: number;
  mime_type?: string;
}

export interface ChannelData {
  id: string;
  type: string;
  name: string;
  members: string[];
  created_at?: string;
  updated_at?: string;
  blocked?: boolean;
}

export interface ClientConfig {
  api_key: string;
  user_token: string;
  channels: ChannelData[];
}

export interface AuthResponse {
  userId: string;
  token: string;
}

export interface AuthRequest {
  username: string;
}

export interface CreateChannelRequest {
  channelId: string;
  channelName: string;
  userId: string;
}

export interface SendMessageRequest {
  channelId: string;
  message: string;
  userId: string;
}
