import {
  ChatMessage,
  ChatRequest,
  Provider,
  ProviderClient,
} from "../../src/types";
import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";
import { Database } from "better-sqlite3";

export default class Providers {
  private provider: Provider;
  private data: ChatRequest;

  constructor(private readonly db: Database) {}

  public async initializeProvider(provider: Provider): Promise<ProviderClient> {
    switch (provider.type) {
      case "openai":
        return {
          type: "openai",
          client: new OpenAI({
            apiKey: provider.apiKey,
            baseURL: `${provider.baseUrl}/v1`,
          }),
        };
      case "anthropic":
        return {
          type: "anthropic",
          client: new Anthropic({
            apiKey: provider.apiKey,
            baseURL: provider.baseUrl,
          }),
        };
      default:
        throw new Error(`Unsupported provider type: ${provider.type}`);
    }
  }

  public async chat() {
    const { provider, messages } = this.data;
    const providerId = String(this.provider.id);

    const providerInstances: Map<string, ProviderClient> = new Map();

    let llm = providerInstances.get(providerId);

    if (!llm) {
      llm = await this.initializeProvider(this.provider);
      providerInstances.set(providerId, llm);
    }

    try {
      if (this.provider.type === "openai" && llm.type === "openai") {
        const completion = await llm.client.chat.completions.create({
          model: this.provider.model,
          messages: messages.map((m: ChatMessage) => ({
            role: m.role,
            content: m.content,
          })),
          stream: false,
        });
        return completion.choices[0].message.content;
      }

      if (this.provider.type === "anthropic" && llm.type === "anthropic") {
        const response = await llm.client.messages.create({
          model: this.provider.model,
          messages: messages.map((m: ChatMessage) => ({
            role: m.role === "user" ? "user" : "assistant",
            content: m.content,
          })),
          max_tokens: 1024,
        });
        return response.content;
      }

      throw new Error(
        `Provider type mismatch or unsupported provider type: ${this.provider.type}`
      );
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error("Chat error:", error);
        throw new Error(error.message);
      }
      throw new Error("Failed to get response from provider");
    }
  }
}
