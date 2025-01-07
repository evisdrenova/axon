import { Message, Provider, ProviderClient } from "../types";
import Anthropic from "@anthropic-ai/sdk";
import MCP from "src/mcp/mcp";

interface ToolResults {
  call: any;
  result: any;
}
export default class AnthropicHandler {
  constructor(private readonly mcp: MCP) {}

  public async handleQuery(
    providerClient: ProviderClient,
    messages: Message[],
    currentProvider: Provider
  ) {
    const finalText: string[] = [];
    let toolResults: ToolResults[];

    const availableTools = await this.mcp.listTools();

    try {
      const response = await this.callAnthropic(
        providerClient,
        messages,
        currentProvider,
        availableTools
      );

      console.log("the initial response", response);

      // there are only two content types: "text" and "tool use"
      for (const content of response.content) {
        if (content.type === "text") {
          // llm didn't respond with tool_use just return the text
          console.log("");
          finalText.push(content.text);
        } else if (content.type === "tool_use" && this.mcp) {
          // const res = await this.anthropicToolHandler(
          //   content,
          //   finalText,
          //   toolResults
          // );

          const toolName = content.name;
          const toolArgs = content.input;

          console.log("tool content", content);

          console.log("tool name", toolName);
          console.log("tool args", toolArgs);
          //we append the client name to the beginning of the tool name with an hyphen, so let's get that
          const client = toolName.split("-")[0];
          console.log("client name", toolName);
          console.log("tool name split", toolName.split("-")[1]);
          const result = await this.mcp.callTool({
            client,
            name: toolName.split("-")[1],
            args: toolArgs,
          });

          const tr = {
            call: toolName,
            result: result,
          };

          toolResults.push(tr);
          finalText.push(`[Calling tool ${toolName} with args ${toolArgs}]`);

          if ("text" in content && content.text) {
            messages.push({
              role: "assistant",
              content: content.text as string,
            });
          }
          // if there is another tool use response
          messages.push({ role: "user", content: String(result.content) });

          // finalText.push(toolResult);
          // console.log("toolresult", toolResult);
          // Get next response from LLM
          const followUpResponse = await this.callAnthropic(
            providerClient,
            messages,
            currentProvider
          );
          console.log("followup", followUpResponse.content);
          if (followUpResponse.content[0].type == "text") {
            finalText.push(followUpResponse.content[0].text);
          }
        }
      }

      console.log("finalText", finalText.join("\n"));

      return finalText.join("\n");
    } catch (error) {
      console.error("Error in processQuery:", error);
      throw error;
    }
  }

  private async callAnthropic(
    provider: ProviderClient,
    messages: Message[],
    currentProvider: Provider,
    tools?: Anthropic.Tool[]
  ) {
    try {
      if (provider.type === "anthropic") {
        const convertedMessages = this.createAnthropicMessage(messages);
        return await provider.client.messages.create({
          model: currentProvider.model,
          max_tokens: 1024,
          tools: tools,
          messages: convertedMessages,
        });
      }
    } catch (e) {
      throw new Error(`Unsupported provider type: ${currentProvider.type}`);
    }
  }

  private createAnthropicMessage(
    messages: Message[]
  ): Anthropic.MessageParam[] {
    let aMessage: Anthropic.MessageParam[];

    aMessage = messages.map((m) => ({
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
  private async anthropicToolHandler(
    content: any,
    finalText: string[],
    toolResults: ToolResults[]
  ) {
    const toolName = content.name;
    const toolArgs = content.input;

    try {
      console.log("tool name", toolName);
      console.log("tool name", toolArgs);
      const [client, ...rest] = toolName.split("-");
      const actualToolName = rest.join("-"); // In case tool name has hyphens

      const result = await this.mcp.callTool({
        client,
        name: actualToolName,
        args: toolArgs,
      });

      const tr = {
        call: toolName,
        result: result,
      };

      toolResults.push(tr);
      finalText.push(`[Calling tool ${toolName} with args ${toolArgs}]`);

      console.log("tool result return", result);

      return result;
      // // Update conversation history
      // if (content.text) {
      //   messages.push({
      //     role: "assistant",
      //     content: content.text,
      //   });
      // }
      // messages.push({
      //   role: "user",
      //   content: result.content as string,
      // });

      // return `[Tool ${toolName} executed with result: ${JSON.stringify(
      //   result
      // )}]`;
    } catch (error) {
      console.error(`Error executing tool ${toolName}:`, error);
      throw error;
    }
  }
}
