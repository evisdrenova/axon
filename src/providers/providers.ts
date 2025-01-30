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
        return this.anthropicHandler.makeToolCall(
          providerClient,
          messages,
          this.currentProvider
        );
      default:
        throw new Error("Unable to determine the provider");
    }
  }

  public async summarizeContext(messages: Message[]): Promise<string> {
    if (!this.currentProvider) {
      throw new Error("No provider selected");
    }

    const providerClient = await this.getProviderInstance(this.currentProvider);

    const systemPrompt = `I want you to summarize the conversation provided in the messages and return it back in one paragraph. Your summary should capture the most important aspects of the conversation such that if the summary were given to another LLM, it would understand the background and context of the conversation and be able to continue it with the user. 

    The summary output must follow these rules:
    1. It must be wrapped in <summary></summary> tags
    2. The output should always be shorter than the messages that you are summarizing. Keep the length of the summary to less than 4 sentences.
    3. If you are returning any code examples, they should always be wrapped in <code> tags.
`;

    switch (this.currentProvider.type) {
      case "anthropic":
        const res = await this.anthropicHandler.callAnthropic(
          providerClient,
          messages,
          this.currentProvider,
          undefined,
          systemPrompt
        );

        const content = res.content[0];
        if (content.type === "text") {
          return content.text;
        } else {
          throw new Error("Unexpected response type from Anthropic API");
        }
      default:
        throw new Error("Unable to determine the provider");
    }
  }
}
