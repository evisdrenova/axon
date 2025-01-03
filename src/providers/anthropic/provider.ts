// export class AnthropicProvider implements Provider {
//   private model: string;
//   private client: Client;

//   constructor(client: Client, model: string) {
//     this.client = client;
//     this.model = model;
//   }

//   async createMessage(
//     ctx: Context,
//     prompt: string,
//     messages: Message[],
//     tools: Tool[]
//   ): Promise<Message> {
//     // Anthropic-specific implementation
//   }

//   async createToolResponse(
//     toolCallId: string,
//     content: unknown
//   ): Promise<Message> {
//     // Anthropic-specific implementation
//   }

//   supportsTools(): boolean {
//     return true; // or whatever is appropriate for Anthropic
//   }

//   name(): string {
//     return "anthropic";
//   }
// }
