import { useEffect, useState } from "react";
import { Message, Provider } from "../types";
import { Separator } from "../../components/ui/separator";
import ChatInterface from "../../src/chat-interface/MarkdownRender";
import ChatInput from "../../components/ChatInterface/ChatInput";
import ModelSelect from "../../components/ChatInterface/ModelSelect";

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
      if (providers.length > 0) {
        const defaultProvider = providers[0];
        setSelectedProvider(defaultProvider.id?.toString() || "");
        setCurrentProvider(defaultProvider);
        window.electron.selectProvider(defaultProvider);
      }
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

  return (
    <div className="min-h-[80vh] flex-col">
      <ChatInterface messages={messages} isLoading={isLoading} />
      <Separator className="my-2" />
      <ModelSelect
        handleProviderSelect={handleProviderSelect}
        selectedProvider={selectedProvider}
        providers={providers}
      />
      <ChatInput
        inputValue={inputValue}
        setInputValue={setInputValue}
        currentProvider={currentProvider}
        isLoading={isLoading}
        handleSubmit={handleSubmit}
      />
      {error && <p className="text-destructive text-sm mt-2">{error}</p>}
    </div>
  );
}
