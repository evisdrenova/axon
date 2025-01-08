import { Message, Provider, ProviderClient } from "../types";
import Anthropic from "@anthropic-ai/sdk";
import MCP from "src/mcp/mcp";

interface ToolResult {
  call: string;
  result: any;
  // result: {
  //   toolResult?: any;
  //   content?: string;
  // };
}

// TODO: fix the back and forth after the first initial message
// we need to get the client to actually make the calls and return the info to the LLM
// we're close but it's not consistent so we may have to update the system prompt
export default class AnthropicHandler {
  constructor(private readonly mcp: MCP) {}

  public async handleQuery(
    providerClient: ProviderClient,
    messages: Message[],
    currentProvider: Provider
  ) {
    console.log("message array 1", messages);
    const finalText: string[] = [];
    const toolResults: ToolResult[] = [];

    const availableTools = await this.mcp.listTools();

    console.log("available tools", availableTools);

    //   while (true) {
    //     try {
    //       const response = await this.callAnthropic(
    //         providerClient,
    //         messages,
    //         currentProvider,
    //         availableTools
    //       );

    //       console.log("Processing response content:", response.content);

    //       for (const content of response.content) {
    //         if (content.type === "text") {
    //           console.log("Processing text content:", content.text);
    //           if (content.text) {
    //             finalText.push(content.text);
    //           }
    //         } else if (content.type === "tool_use" && this.mcp) {
    //           console.log("Processing tool use:", content);

    //           const toolName = content.name;
    //           const toolArgs = content.input;

    //           // Parse client name and tool name
    //           const [client, ...toolNameParts] = toolName.split("-");
    //           const actualToolName = toolNameParts.join("-");

    //           console.log("Tool execution details:", {
    //             client,
    //             toolName: actualToolName,
    //             args: toolArgs,
    //           });

    //           try {
    //             const result = await this.mcp.callTool({
    //               client,
    //               name: actualToolName,
    //               args: toolArgs,
    //             });

    //             console.log("Tool execution result:", result);

    //             const toolResult: ToolResult = {
    //               call: toolName,
    //               result: result,
    //             };

    //             toolResults.push(toolResult);
    //             finalText.push(
    //               `[Calling tool ${toolName} with args ${JSON.stringify(
    //                 toolArgs
    //               )}]`
    //             );

    //             console.log("the content", content);
    //             // Add tool result to conversation
    //             if (content) {
    //               messages.push({
    //                 role: "assistant",
    //                 content: String(content),
    //               });
    //             }

    //             // Add tool result as user message
    //             messages.push({
    //               role: "user",
    //               content: String(result.content),
    //             });

    //             // Get AI's response to tool result
    //             const followUpResponse = await this.callAnthropic(
    //               providerClient,
    //               messages,
    //               currentProvider
    //             );

    //             if (followUpResponse.content[0].type === "text") {
    //               finalText.push(followUpResponse.content[0].text);
    //             }
    //           } catch (error) {
    //             console.error(`Error executing tool ${actualToolName}:`, error);
    //             finalText.push(
    //               `[Error executing tool ${toolName}: ${error.message}]`
    //             );
    //           }
    //         }
    //       }

    //       return finalText.join("\n");
    //     } catch (error) {
    //       console.error("Error in processQuery:", error);
    //       throw error;
    //     }
    //   }
    // }

    console.log("currentProvider", currentProvider);

    try {
      const response = await this.callAnthropic(
        providerClient,
        messages,
        currentProvider,
        availableTools
      );

      console.log("message array 2", response.content);

      // iterates through the content
      for (const content of response.content) {
        if (content.type === "text") {
          // llm didn't respond with tool_use just return the text
          console.log("content is text", content.text);
          finalText.push(content.text);
        } else if (content.type === "tool_use" && this.mcp) {
          console.log("content is tool_use", content);
          // const res = await this.anthropicToolHandler(
          //   content,
          //   finalText,
          //   toolResults
          // );

          const toolName = content.name;
          const toolArgs = content.input;

          console.log("tool name", toolName);
          console.log("tool args", toolArgs);
          //we append the client name to the beginning of the tool name with an hyphen, so let's get that
          // const client = toolName.split("-")[0];
          // console.log("client name", toolName);
          // console.log("tool name split", toolName.split("-")[1]);
          const [client, ...toolNameParts] = toolName.split("__");
          console.log("client name", client);
          const actualToolName = toolNameParts.join("-");
          console.log("actualToolName", actualToolName);
          const result = await this.mcp.callTool({
            client,
            name: actualToolName,
            args: toolArgs,
          });

          console.log("call tool content", result.toolResult);

          const toolResult = {
            call: toolName,
            result: result,
          };

          console.log("call tool result", result.toolResult);

          toolResults.push(toolResult);
          console.log("tool results array", toolResult);
          finalText.push(`[Calling tool ${toolName} with args ${toolArgs}]`);
          console.log("final text array", finalText);
          if ("text" in content && content.text) {
            messages.push({
              role: "assistant",
              content: content.text as string,
            });
          }
          console.log("message 3 ", messages);
          // if there is another tool use response
          messages.push({ role: "user", content: result.content });
          console.log("message 4 ", messages);
          // finalText.push(toolResult);
          // console.log("toolresult", toolResult);
          // Get next response from LLM
          const followUpResponse = await this.callAnthropic(
            providerClient,
            messages,
            currentProvider
          );
          console.log("followup results", followUpResponse.content);
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
    if (provider.type !== "anthropic") {
      throw new Error(`Unsupported current provider type: ${provider.type}`);
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
      throw new Error(
        `Unsupported current provider type. Expected 'anthropic', got: ${currentProvider.type}`
      );
    }
  }

  private createAnthropicMessage(
    messages: Message[]
  ): Anthropic.MessageParam[] {
    return messages.map((m) => {
      const role = m.role === "user" ? "user" : "assistant";

      // Handle different content types
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
                text: block.text || "",
              };
            } else if (block.type === "tool_use") {
              // Match Anthropic's ToolUseBlockParam interface
              return {
                type: "tool_use",
                id: block.id || crypto.randomUUID(), // Generate ID if not provided
                name: block.name || "",
                input: block.input || {},
              };
            }
            // Default to empty text if type is unknown
            return {
              type: "text",
              text: "",
            };
          }),
        };
      }

      // Default fallback for unexpected content
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

  // private createAnthropicMessage(
  //   messages: Message[]
  // ): Anthropic.MessageParam[] {
  //   let aMessage: Anthropic.MessageParam[];

  //   aMessage = messages.map((m) => ({
  //     role: m.role === "user" ? "user" : "assistant",
  //     content: [
  //       {
  //         type: "text",
  //         text: m.content,
  //       },
  //     ],
  //   }));
  //   return aMessage;
  // }
  // private async anthropicToolHandler(
  //   content: any,
  //   finalText: string[],
  //   toolResults: ToolResults[]
  // ) {
  //   const toolName = content.name;
  //   const toolArgs = content.input;

  //   try {
  //     console.log("tool name", toolName);
  //     console.log("tool name", toolArgs);
  //     const [client, ...rest] = toolName.split("-");
  //     const actualToolName = rest.join("-"); // In case tool name has hyphens

  //     const result = await this.mcp.callTool({
  //       client,
  //       name: actualToolName,
  //       args: toolArgs,
  //     });

  //     const tr = {
  //       call: toolName,
  //       result: result,
  //     };

  //     toolResults.push(tr);
  //     finalText.push(`[Calling tool ${toolName} with args ${toolArgs}]`);

  //     console.log("tool result return", result);

  //     return result;
  //     // // Update conversation history
  //     // if (content.text) {
  //     //   messages.push({
  //     //     role: "assistant",
  //     //     content: content.text,
  //     //   });
  //     // }
  //     // messages.push({
  //     //   role: "user",
  //     //   content: result.content as string,
  //     // });

  //     // return `[Tool ${toolName} executed with result: ${JSON.stringify(
  //     //   result
  //     // )}]`;
  //   } catch (error) {
  //     console.error(`Error executing tool ${toolName}:`, error);
  //     throw error;
  //   }
  // }
}
