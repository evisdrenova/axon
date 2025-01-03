// interface IProvider {
//   createProvider(apiKey: string, baseUrl: string, model: string): Provider;

//   createMessage(
//     prompt: string,
//     messages: Message[],
//     tools: Tool[]
//   ): Promise<Message>;

//   createToolResponse(toolCallId: string, content: unknown): Promise<Message>;

//   supportsTools(): boolean;

//   name(): string;
// }

// interface Message {
//   getRole(): string;
//   getContent(): string;
//   getToolCalls(): ToolCall[];
//   isToolResponse(): boolean;
//   getToolResponseId(): string;
//   getUsage(): [number, number]; // [input, output]
// }

// interface ToolCall {
//   getName(): string;
//   getArguments(): Record<string, unknown>;
//   getId(): string;
// }

// interface Tool {
//   name: string;
//   description: string;
//   inputSchema: Schema;
// }

// interface Schema {
//   type: string;
//   properties: Record<string, unknown>;
//   required: string[];
// }

// class Provider implements IProvider
class Provider {
  private client: Client;
  private model: string;

  constructor(client: Client, model: string) {
    this.client = client;
    this.model = model;
  }

  static createProvider(
    apiKey: string,
    baseUrl: string,
    model: string
  ): Provider {
    const client = new Client(apiKey, baseUrl);
    return new Provider(client, model);
  }
}

class Client {
  private apiKey: string;
  private baseUrl: string;
  private client = fetch;

  constructor(apiKey: string, baseURL: string) {
    if (!baseURL || !apiKey) {
      throw new Error("baseURL and apiKey are required");
    }
    this.apiKey = apiKey;
    this.baseUrl = baseURL.endsWith("/v1")
      ? baseURL
      : `${baseURL.replace(/\/$/, "")}/v1`;
    this.client = fetch;
  }
}
