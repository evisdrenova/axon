import { useEffect, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { ChatMessage, Provider } from "../types";
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
import ReactMarkdown from "react-markdown";

export default function Home() {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [selectedProvider, setSelectedProvider] = useState<string>("");
  const [currentProvider, setCurrentProvider] = useState<Provider | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
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
    setCurrentProvider(provider || null);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!inputValue.trim() || !currentProvider || isLoading) {
      return;
    }

    // Create user message
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: inputValue.trim(),
      timestamp: Date.now(),
    };

    // Update messages with user input
    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);
    setError(null);

    try {
      const response = await window.electron.chat({
        provider: currentProvider,
        messages: [...messages, userMessage],
        message: userMessage.content,
      });

      // Add assistant's response
      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: response,
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err: any) {
      setError(err.message || "Failed to get response");
    } finally {
      setIsLoading(false);
    }
  };

  const renderMessageContent = (
    content: string | { type: string; text: string }
  ) => {
    if (typeof content === "string") {
      return content;
    }
    return content.text || JSON.stringify(content);
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
              {messages.map((message) => (
                <div
                  key={message.id}
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
                    <div className="animate-pulse">Thinking...</div>
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
