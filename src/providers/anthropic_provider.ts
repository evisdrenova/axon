import { Message, Provider, ProviderClient } from "../types";
import Anthropic from "@anthropic-ai/sdk";
import MCP from "src/mcp/mcp";
export default class AnthropicHandler {
  constructor(private readonly mcp: MCP) {}

  public async handleQuery(
    providerClient: ProviderClient,
    messages: Message[],
    currentProvider: Provider
  ) {
    const finalText: string[] = [];

    const availableTools = await this.mcp.listTools();

    try {
      const response = await this.callAnthropic(
        providerClient,
        messages,
        currentProvider,
        availableTools
      );

      // the llm may respond with 2+ message, for example a text message that explains what it wants to do and then a tool_use message that tells you what tools to call, so this iterates over both of those
      for (const content of response.content) {
        if (content.type === "text") {
          finalText.push(content.text);
        } else if (content.type === "tool_use" && this.mcp) {
          const toolName = content.name;
          const toolArgs = content.input;

          const result = await this.anthropicToolHandler(toolName, toolArgs);

          if ("text" in content && content.text) {
            messages.push({
              role: "assistant",
              content: content.text as string,
            });
          }
          messages.push({
            role: "user",
            content: result.content as Anthropic.ContentBlock[],
          });

          const followUpResponse = await this.callAnthropic(
            providerClient,
            messages,
            currentProvider
          );

          if (followUpResponse.content[0].type == "text") {
            finalText.push(followUpResponse.content[0].text);
          }
        }
      }
      return finalText.join("\n");
    } catch (error) {
      console.error("Error in handling user query and/or llm response:", error);
      throw error;
    }
  }

  private async callAnthropic(
    provider: ProviderClient,
    messages: Message[],
    currentProvider: Provider,
    tools?: Anthropic.Tool[]
  ) {
    if (provider.type !== "anthropic") {
      throw new Error(
        `Unsupported provider type. Expecint 'anthopric', got: ${provider.type}`
      );
    }
    try {
      const systemMessage: Anthropic.MessageParam = {
        role: "assistant",
        content: [
          {
            type: "text",
            text: "You have access to tools that you should use directly when appropriate. Instead of describing how you would use the tools, you should actually use them to help the user. When a user asks about files or directories, use the filesystem tools to help them.",
          },
        ],
      };
      const convertedMessages = this.createAnthropicMessage(messages);
      return await provider.client.messages.create({
        model: currentProvider.model,
        max_tokens: 1024,
        tools: tools,
        messages: [systemMessage, ...convertedMessages],
        system:
          "Use available tools directly instead of describing how you would use them.",
      });
    } catch (e) {
      throw new Error(`Error calling the anthropic API, got: ${e}`);
    }
  }

  private createAnthropicMessage(
    messages: Message[]
  ): Anthropic.MessageParam[] {
    return messages.map((m) => {
      const role = m.role === "user" ? "user" : "assistant";

      if (typeof m.content === "string") {
        return {
          role,
          content: [
            {
              type: "text",
              text: m.content,
            },
          ],
        };
      } else if (Array.isArray(m.content)) {
        return {
          role,
          content: m.content.map((block): Anthropic.ContentBlockParam => {
            if (block.type === "text") {
              return {
                type: "text",
                text: block.text ?? "",
              };
            } else if (block.type === "tool_use") {
              return {
                type: "tool_use",
                id: block.id ?? crypto.randomUUID(),
                name: block.name ?? "",
                input: block.input ?? {},
              };
            }
            return {
              type: "text",
              text: "",
            };
          }),
        };
      }
      return {
        role,
        content: [
          {
            type: "text",
            text: String(m.content),
          },
        ],
      };
    });
  }

  private async anthropicToolHandler(toolName: string, toolArgs: any) {
    //we append the client name to the beginning of the tool name with an __, so we need to split the string to get the client name
    const [client, ...toolNameParts] = toolName.split("__");
    const actualToolName = toolNameParts.join("-");

    try {
      return await this.mcp.callTool({
        client,
        name: actualToolName,
        args: toolArgs,
      });
    } catch (error) {
      console.error(`Error executing tool ${toolName}:`, error);
      throw error;
    }
  }
}
