import { useEffect, useRef, useState } from "react";
import { Message, Provider } from "../types";
import ChatScrollArea from "../chat-interface/ChatScrollArea";
import ChatInput from "../../components/ChatInterface/ChatInput";
import ModelSelect from "../../components/ChatInterface/ModelSelect";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "../../components/ui/resizable";

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
    <div className="flex flex-col h-full">
      <ResizablePanelGroup direction="vertical">
        <ResizablePanel defaultSize={70} minSize={10}>
          <div className="flex-1  overflow-auto  px-40">
            <ChatScrollArea messages={messages} isLoading={isLoading} />
          </div>
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel minSize={30} defaultSize={30}>
          <div className="flex flex-col gap-2 h-full overflow-hidden px-40">
            <div>
              <ModelSelect
                handleProviderSelect={handleProviderSelect}
                selectedProvider={selectedProvider}
                providers={providers}
              />
            </div>
            <ChatInput
              inputValue={inputValue}
              setInputValue={setInputValue}
              currentProvider={currentProvider}
              isLoading={isLoading}
              handleSubmit={handleSubmit}
            />
            {error && <p className="text-destructive text-sm mt-2">{error}</p>}
          </div>
          {error && <p className="text-destructive text-sm mt-2">{error}</p>}
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}
