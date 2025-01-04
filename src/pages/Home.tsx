import { useEffect, useState } from "react";
import { useChat } from "ai/react";
import { Provider } from "../types";
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

  console.log("selected privider", selectedProvider);
  console.log(" privider", providers);

  const customSubmit = async (messages: any[]) => {
    const latestMessage = messages[messages.length - 1];

    try {
      if (!currentProvider) throw new Error("No provider selected");

      const response = await window.electron.chat({
        provider: currentProvider,
        messages: messages,
        message: latestMessage.content,
      });

      return response;
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  // Initialize useChat with custom submit
  const { messages, input, handleInputChange, handleSubmit, isLoading } =
    useChat({
      api: customSubmit,
    });

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

  return (
    <div className="container max-w-4xl mx-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Chat Interface</CardTitle>
        </CardHeader>
        <CardContent>
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

          <ScrollArea className="h-[300px] pr-4">
            <div className="space-y-4">
              {messages.map((message: any) => (
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
                    <ReactMarkdown
                      className="prose dark:prose-invert max-w-none"
                      components={{
                        pre: ({ node, ...props }) => (
                          <div className="bg-secondary p-2 rounded my-2">
                            <pre {...props} />
                          </div>
                        ),
                        code: ({ node, ...props }) => (
                          <code
                            className="bg-secondary px-1 rounded"
                            {...props}
                          />
                        ),
                      }}
                    >
                      {message.content}
                    </ReactMarkdown>
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
              value={input}
              onChange={handleInputChange}
              placeholder="Type a message..."
              disabled={!currentProvider || isLoading}
              className="flex-1"
            />
            <Button type="submit" disabled={!currentProvider || isLoading}>
              Send
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
