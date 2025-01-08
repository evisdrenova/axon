import { Message, Provider, ProviderClient } from "../../src/types";
import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";
import MCP from "src/mcp/mcp";
import AnthropicHandler from "./anthropic_provider";

export default class Providers {
  private providerInstances: Map<string, ProviderClient> = new Map();
  private currentProvider: Provider | null = null;
  private anthropicHandler: AnthropicHandler;

  constructor(private readonly mcp: MCP) {
    this.anthropicHandler = new AnthropicHandler(mcp);
  }

  public setProvider(provider: Provider) {
    if (!this.currentProvider || this.currentProvider.id !== provider.id) {
      this.currentProvider = provider;
    }
  }

  public getCurrentProvider(): Provider | null {
    return this.currentProvider;
  }

  private async initializeProvider(
    provider: Provider
  ): Promise<ProviderClient> {
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

  private async getProviderInstance(
    provider: Provider
  ): Promise<ProviderClient> {
    const providerId = String(provider.id);
    let instance = this.providerInstances.get(providerId);

    if (!instance) {
      instance = await this.initializeProvider(provider);
      this.providerInstances.set(providerId, instance);
    }

    return instance;
  }

  public async processQuery(messages: Message[]): Promise<string> {
    if (!this.currentProvider) {
      throw new Error("No provider selected");
    }

    const providerClient = await this.getProviderInstance(this.currentProvider);

    switch (this.currentProvider.type) {
      case "anthropic":
        return this.anthropicHandler.handleQuery(
          providerClient,
          messages,
          this.currentProvider
        );
      default:
        throw new Error("Unable to determine the provider");
    }
  }
}
