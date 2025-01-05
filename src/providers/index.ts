import {
  ChatMessage,
  ChatRequest,
  Provider,
  ProviderClient,
} from "../../src/types";
import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";

export function initializeProvider(provider: Provider): ProviderClient {
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

// create a map in case there are multple providers and we want to switch back and forth which, the map helps us avoid re-initializing clients again
const providerInstances: Map<string, ProviderClient> = new Map();

export async function Chat(data: ChatRequest) {
  const { provider, messages } = data;
  const providerId = String(provider.id);

  let llm = providerInstances.get(providerId);

  if (!llm) {
    llm = initializeProvider(provider);
    providerInstances.set(providerId, llm);
  }

  console.log("provider", provider);

  try {
    if (provider.type === "openai" && llm.type === "openai") {
      const completion = await llm.client.chat.completions.create({
        model: provider.model,
        messages: messages.map((m: ChatMessage) => ({
          role: m.role,
          content: m.content,
        })),
        stream: false,
      });
      return completion.choices[0].message.content;
    }

    if (provider.type === "anthropic" && llm.type === "anthropic") {
      const response = await llm.client.messages.create({
        model: provider.model,
        messages: messages.map((m: ChatMessage) => ({
          role: m.role === "user" ? "user" : "assistant",
          content: m.content,
        })),
        max_tokens: 1024,
      });
      return response.content;
    }

    throw new Error(
      `Provider type mismatch or unsupported provider type: ${provider.type}`
    );
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error("Chat error:", error);
      throw new Error(error.message);
    }
    throw new Error("Failed to get response from provider");
  }
}
