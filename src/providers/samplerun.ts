interface ContentBlock {
  type: string;
  text?: string;
  id?: string;
  name?: string;
  input?: any;
  toolUseId?: string;
  content?: ContentBlock[];
}

interface HistoryMessage {
  role: string;
  content: ContentBlock[];
}

interface Tool {
  name: string;
  description: string;
  // Add other tool properties as needed
}

interface ToolCall {
  getId(): string;
  getName(): string;
  getArguments(): any;
}

interface Message {
  getRole(): string;
  getContent(): string;
  getToolCalls(): ToolCall[];
  getUsage(): [number, number]; // [inputTokens, outputTokens]
}

interface Provider {
  createMessage(
    context: any,
    prompt: string,
    messages: Message[],
    tools: Tool[]
  ): Promise<Message>;
}

interface MCPClient {
  callTool(context: any, request: CallToolRequest): Promise<CallToolResult>;
}

interface CallToolRequest {
  params: {
    name: string;
    arguments: any;
  };
}

interface CallToolResult {
  content?: any[];
}

class App {
  private initialBackoff = 1000; // 1 second
  private maxBackoff = 32000; // 32 seconds
  private maxRetries = 5;

  async runPrompt(
    provider: Provider,
    mcpClients: { [key: string]: MCPClient },
    tools: Tool[],
    prompt: string,
    messages: HistoryMessage[]
  ): Promise<void> {
    // Display the user's prompt if it's not empty (i.e., not a tool response)
    if (prompt !== "") {
      console.log(`\nYou: ${prompt}\n`);
      messages.push({
        role: "user",
        content: [
          {
            type: "text",
            text: prompt,
          },
        ],
      });
    }

    let message: Message;
    let backoff = this.initialBackoff;
    let retries = 0;

    // Convert messages to LLM format
    const llmMessages = messages.map((msg) => msg as unknown as Message);

    while (true) {
      try {
        // calls LLM with a new message to get an initial response on the user's prompt
        message = await this.withSpinner("Thinking...", () =>
          provider.createMessage(
            {}, // context
            prompt,
            llmMessages,
            tools
          )
        );
        break;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);

        if (errorMessage.includes("overloaded_error")) {
          if (retries >= this.maxRetries) {
            throw new Error(
              "claude is currently overloaded. please wait a few minutes and try again"
            );
          }

          console.warn(
            `Claude is overloaded, backing off... attempt ${
              retries + 1
            }, backoff ${backoff}ms`
          );

          await new Promise((resolve) => setTimeout(resolve, backoff));
          backoff *= 2;
          if (backoff > this.maxBackoff) {
            backoff = this.maxBackoff;
          }
          retries++;
          continue;
        }
        throw error;
      }
    }

    let messageContent: ContentBlock[] = [];
    const toolResults: ContentBlock[] = [];

    // Handle the message response
    console.log("\nAssistant: ");

    // Add text content
    if (message.getContent()) {
      console.log(message.getContent() + "\n");
      messageContent.push({
        type: "text",
        text: message.getContent(),
      });
    }

    // Handle tool calls
    for (const toolCall of message.getToolCalls()) {
      console.log(`🔧 Using tool: ${toolCall.getName()}`);

      const input = JSON.stringify(toolCall.getArguments());
      messageContent.push({
        type: "tool_use",
        id: toolCall.getId(),
        name: toolCall.getName(),
        input: JSON.parse(input),
      });

      // Log usage statistics if available
      const [inputTokens, outputTokens] = message.getUsage();
      if (inputTokens > 0 || outputTokens > 0) {
        console.log(
          `Usage statistics: input_tokens=${inputTokens}, ` +
            `output_tokens=${outputTokens}, ` +
            `total_tokens=${inputTokens + outputTokens}`
        );
      }

      const parts = toolCall.getName().split("__");
      if (parts.length !== 2) {
        console.log(`Error: Invalid tool name format: ${toolCall.getName()}`);
        continue;
      }

      const [serverName, toolName] = parts;
      const mcpClient = mcpClients[serverName];
      if (!mcpClient) {
        console.log(`Error: Server not found: ${serverName}`);
        continue;
      }

      let toolArgs: any;
      try {
        toolArgs = JSON.parse(input);
      } catch (error) {
        console.log(`Error parsing tool arguments: ${error}`);
        continue;
      }

      let toolResult: CallToolResult;
      try {
        toolResult = await this.withSpinner(
          `Running tool ${toolName}...`,
          async () => {
            const req: CallToolRequest = {
              params: {
                name: toolName,
                arguments: toolArgs,
              },
            };
            return await mcpClient.callTool({}, req);
          }
        );
      } catch (error) {
        const errMsg = `Error calling tool ${toolName}: ${error}`;
        console.error(errMsg);

        toolResults.push({
          type: "tool_result",
          toolUseId: toolCall.getId(),
          content: [
            {
              type: "text",
              text: errMsg,
            },
          ],
        });
        continue;
      }

      if (toolResult.content) {
        console.debug("raw tool result content:", toolResult.content);

        // Create the tool result block
        const resultBlock: ContentBlock = {
          type: "tool_result",
          toolUseId: toolCall.getId(),
          content: toolResult.content,
        };

        // Extract text content
        let resultText = "";
        for (const item of toolResult.content) {
          if (typeof item === "object" && item !== null) {
            if ("text" in item) {
              resultText += `${item.text} `;
            }
          }
        }

        resultBlock.text = resultText.trim();
        console.debug(
          "created tool result block:",
          resultBlock,
          "tool_id:",
          toolCall.getId()
        );

        toolResults.push(resultBlock);
      }
    }

    messages.push({
      role: message.getRole(),
      content: messageContent,
    });

    if (toolResults.length > 0) {
      messages.push({
        role: "user",
        content: toolResults,
      });
      // Make another call to get Claude's response to the tool results
      return this.runPrompt(provider, mcpClients, tools, "", messages);
    }

    console.log(); // Add spacing
  }

  private async withSpinner<T>(
    title: string,
    action: () => Promise<T>
  ): Promise<T> {
    console.log(`${title}...`);
    try {
      return await action();
    } finally {
      // Clear the spinner (implementation depends on your terminal library)
    }
  }
}

export default App;
