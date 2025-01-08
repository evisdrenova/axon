import { useEffect, useState } from "react";
import { Message, Provider } from "../types";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Button } from "../../components/ui/button";
import { ScrollArea } from "../../components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import { Separator } from "../../components/ui/separator";
import Anthropic from "@anthropic-ai/sdk";
import ReactMarkdown from "react-markdown";

export default function Home() {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [selectedProvider, setSelectedProvider] = useState<string>("");
  const [currentProvider, setCurrentProvider] = useState<Provider | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const loadProviders = async () => {
    try {
      const providers = await window.electron.getProviders();
      setProviders(providers);
    } catch (err) {
      setError("Failed to load providers");
    }
  };

  useEffect(() => {
    loadProviders();
  }, []);

  const handleProviderSelect = (providerId: string) => {
    setSelectedProvider(providerId);
    const provider = providers.find((p) => p.id?.toString() === providerId);
    try {
      window.electron.selectProvider(provider);
      setCurrentProvider(provider || null);
    } catch (e) {
      console.log("there was an error setting the provider", e);
      setError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!inputValue.trim() || !currentProvider || isLoading) {
      return;
    }

    // Create user message
    const userMessage: Message = {
      role: "user",
      content: inputValue.trim(),
    };

    // Update messages with user input
    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);
    setError(null);

    try {
      const response = await window.electron.chat([...messages, userMessage]);

      // Add assistant's response
      const assistantMessage: Message = {
        role: "assistant",
        content: response,
      };
      // append assistant response to chat log
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err: any) {
      setError(err.message || "Failed to get response");
    } finally {
      setIsLoading(false);
    }
  };

  // const renderMessageContent = (content: string | Anthropic.ContentBlock[]) => {
  //   if (typeof content === "string") {
  //     return content;
  //   } else {
  //     return JSON.stringify(content);
  //   }
  // };

  const renderMessageContent = (content: string | Anthropic.ContentBlock[]) => {
    if (typeof content === "string") {
      return renderMarkdown(content);
    } else if (Array.isArray(content)) {
      return content.map((block, index) => {
        if (block.type === "text") {
          return renderMarkdown(block.text || "");
        }
        // Handle other block types...
        return null;
      });
    }
    return null;
  };

  const convertToMarkdown = (text: string) => {
    // Split the text into parts - headers, lists, and regular text
    const parts = text.split("\n");

    // Process each line
    const markdownLines = parts.map((line) => {
      // Check if it's a numbered list item
      const listItemMatch = line.match(/^(\d+)\.\s(.+?)(\(image:\s(.+?)\))$/);
      if (listItemMatch) {
        // Format as markdown list with bold image name
        return `${listItemMatch[1]}. ${listItemMatch[2]}(**${listItemMatch[4]}**)`;
      }

      // Return regular lines as-is
      return line;
    });

    return markdownLines.join("\n");
  };

  const renderMarkdown = (content: string) => {
    const markdown = convertToMarkdown(content);
    return (
      <ReactMarkdown
        className="prose max-w-none"
        components={{
          // Customize rendering of specific elements
          p: ({ children }: { children: any }) => (
            <p className="my-2">{children}</p>
          ),
          li: ({ children }: { children: any }) => (
            <li className="my-1">{children}</li>
          ),
          strong: ({ children }) => (
            <span className="text-gray-600 font-mono">{children}</span>
          ),
        }}
      >
        {markdown}
      </ReactMarkdown>
    );
  };

  return (
    <div className="container max-w-4xl mx-auto p-4">
      <Card className="min-h-[80vh] flex flex-col">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Chat Interface</CardTitle>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col">
          <div className="mb-4">
            <Select
              onValueChange={handleProviderSelect}
              value={selectedProvider}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a provider" />
              </SelectTrigger>
              <SelectContent>
                {providers.map((provider) => (
                  <SelectItem
                    key={provider.id}
                    value={provider.id?.toString() || ""}
                  >
                    {provider.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {error && <p className="text-destructive text-sm mt-2">{error}</p>}
          </div>

          <Separator className="my-4" />

          <ScrollArea className="flex-1 pr-4">
            <div className="space-y-4">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${
                    message.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`rounded-lg px-4 py-2 max-w-[80%] ${
                      message.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted"
                    }`}
                  >
                    <div>{renderMessageContent(message.content)}</div>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-muted rounded-lg px-4 py-2">
                    <div className="animate-pulse">Analyzing...</div>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          <Separator className="my-4" />

          <form onSubmit={handleSubmit} className="flex gap-2">
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Type a message..."
              disabled={!currentProvider || isLoading}
              className="flex-1"
            />
            <Button
              type="submit"
              disabled={!currentProvider || isLoading || !inputValue.trim()}
            >
              Send
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
