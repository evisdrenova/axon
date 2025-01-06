import {
  ChatMessage,
  ChatRequest,
  Provider,
  ProviderClient,
} from "../../src/types";
import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";
import { Database } from "better-sqlite3";
import MCP from "src/mcp/mcp";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default class Providers {
  private providerInstances: Map<string, ProviderClient> = new Map();
  private currentProvider: Provider | null = null;
  // private mcp: MCP;

  constructor(private readonly mcp: MCP) {}

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

  public async processQuery(messages: ChatRequest): Promise<string> {
    if (!this.currentProvider) {
      throw new Error("No provider selected");
    }

    console.log("the input query", messages);

    const llm = await this.getProviderInstance(this.currentProvider);
    const finalText: string[] = [];
    const availableTools = await this.mcp.listTools();

    try {
      // Initial LLM call with tools if available
      // this is where the LLM determines which tools it needs to use
      const response = await this.createLLMMessage(
        llm,
        messages,
        availableTools
      );

      console.log("initial llm message", response);

      if (this.currentProvider.type === "anthropic") {
        // there are only two content types: "text" and "tool use"
        for (const content of response.content) {
          if (content.type === "text") {
            // just append it to the messages we return
            finalText.push(content.text);
          } else if (content.type === "tool_use" && this.mcp) {
            // it's message about tool use
            const toolResult = await this.handleToolUse(content, messages);
            finalText.push(toolResult);
            console.log("toolresult", toolResult);

            // Get next response from LLM
            const followUpResponse = await this.createLLMMessage(llm, messages);
            console.log("followup", followUpResponse.content);
            // if(finalText.push(followUpResponse.content[0].type == 'text')){
            //   finalText.push(followUpResponse.content[0].text);
            // }
          }
        }
      }
      // else {
      //   // Handle OpenAI or other providers' response format
      //   finalText.push(response.choices[0].message.content);
      // }

      return finalText.join("\n");
    } catch (error) {
      console.error("Error in processQuery:", error);
      throw error;
    }
  }

  private async createLLMMessage(
    llm: ProviderClient,
    messages: ChatRequest,
    tools?: Anthropic.Tool[]
  ) {
    if (!this.currentProvider) throw new Error("No provider selected");

    // if (this.currentProvider.type === "openai" && llm.type === "openai") {
    //   return await llm.client.chat.completions.create({
    //     model: this.currentProvider.model,
    //     messages: messages.map((m) => ({
    //       role: m.role,
    //       content: m.content,
    //     })),
    //     stream: false,
    //   });
    // }

    console.log("a", messages);

    if (this.currentProvider.type === "anthropic" && llm.type === "anthropic") {
      const convertedMessages = this.createAnthropicMessage(messages);
      return await llm.client.messages.create({
        model: this.currentProvider.model,
        max_tokens: 1024,
        tools: tools,
        messages: convertedMessages,
      });
    }
    throw new Error(`Unsupported provider type: ${this.currentProvider.type}`);
  }

  // export interface MessageParam {
  //   content: string | Array<ContentBlockParam>;

  //   role: "user" | "assistant";
  // }

  // export type ContentBlockParam = TextBlockParam;
  // // | ImageBlockParam
  // // | ToolUseBlockParam
  // // | ToolResultBlockParam
  // // | DocumentBlockParam;

  // export interface TextBlockParam {
  //   text: string;

  //   type: "text";

  //   // cache_control?: CacheControlEphemeral | null;
  // }

  // converts axon message to anthropic specific message type
  private createAnthropicMessage(
    messages: ChatRequest
  ): Anthropic.MessageParam[] {
    let aMessage: Anthropic.MessageParam[];

    aMessage = messages.messages.map((m) => ({
      role: m.role === "user" ? "user" : "assistant",
      content: [
        {
          type: "text",
          text: m.content,
        },
      ],
    }));
    return aMessage;
  }

  private async handleToolUse(
    content: any,
    messages: ChatRequest
  ): Promise<string> {
    const toolName = content.name;
    const toolArgs = content.input;

    try {
      const [client, ...rest] = toolName.split("-");
      const actualToolName = rest.join("-"); // In case tool name has hyphens

      const result = await this.mcp.callTool({
        client,
        name: actualToolName,
        args: toolArgs,
      });

      // Update conversation history
      if (content.text) {
        messages.messages.push({
          role: "assistant",
          content: content.text,
        });
      }
      messages.messages.push({
        role: "user",
        content: result.content as string,
      });

      return `[Tool ${toolName} executed with result: ${JSON.stringify(
        result
      )}]`;
    } catch (error) {
      console.error(`Error executing tool ${toolName}:`, error);
      throw error;
    }
  }
}
