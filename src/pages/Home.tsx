import { useEffect, useState } from "react";
import { Conversation, Message, Provider, User } from "../types";
import ChatScrollArea from "../chat-interface/ChatScrollArea";
import ChatInput from "../../components/ChatInterface/ChatInput";
import ModelSelect from "../../components/ChatInterface/ModelSelect";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "../../components/ui/resizable";
import ConversationTree from "../../components/ConversationTree/ConversationTree";
import ChatTitle from "../../components/ChatInterface/ChatTitle";
export interface TestConversation {
  id: string;
  name: string;
  parentId: string;
}

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<
    number | null
  >(null);
  const [selectedProvider, setSelectedProvider] = useState<string>("");
  const [currentProvider, setCurrentProvider] = useState<Provider | null>(null);
  const [error, setError] = useState<string | null>(null);
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

  const loadUser = async () => {
    try {
      const user = await window.electron.getUser();
      setUser(user);
    } catch (err) {
      console.error("Error loading user:", err);
    }
  };

  const loadConversations = async () => {
    try {
      const convos = await window.electron.getConversations();
      setConversations(convos);
      if (convos.length > 0 && !activeConversationId) {
        setActiveConversationId(convos[0].id);
      }
    } catch (err) {
      console.error("Error loading conversations:", err);
    }
  };

  useEffect(() => {
    loadUser();
    loadProviders();
    loadConversations();
  }, []);

  const activeConversation = conversations?.find(
    (c) => c.id == activeConversationId
  );
  const messages = activeConversation?.messages ?? [];

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

    if (
      !inputValue.trim() ||
      !currentProvider ||
      isLoading ||
      !activeConversationId
    ) {
      return;
    }

    // Create user message
    const userMessage: Message = {
      role: "user",
      content: inputValue.trim(),
      conversationId: activeConversationId,
    };

    // Update messages with user input
    // setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);
    setError(null);

    try {
      await window.electron.saveMessage(userMessage);

      //this shouldn't include the conversationId when we send it
      const response = await window.electron.chat([...messages, userMessage]);

      const assistantMessage: Message = {
        role: "assistant",
        content: response,
        conversationId: activeConversationId,
      };

      await window.electron.saveMessage(assistantMessage);

      await loadConversations();

      // append assistant response to chat log
      // setMessages((prev) => [...prev, assistantMessage]);
    } catch (err: any) {
      setError(err.message || "Failed to get response");
    } finally {
      setIsLoading(false);
    }
  };

  const onNewConversation = async () => {
    if (!currentProvider) return;

    try {
      const newConversation: Partial<Conversation> = {
        title: `Conversation ${new Date().toLocaleTimeString()}`,
        providerId: currentProvider.id,
        parent_conversation_id: null,
      };
      const newConvoId = await window.electron.createConversation(
        newConversation
      );
      await loadConversations();
      setActiveConversationId(newConvoId);
    } catch (err) {
      setError("Failed to create new conversation");
    }
  };

  const handleBranchConversation = async (conversationId: number) => {
    if (!currentProvider) return;

    const sourceConversation = conversations.find(
      (c) => c.id === conversationId
    );
    if (!sourceConversation) return;

    try {
      const branchedConversation: Partial<Conversation> = {
        title: `${sourceConversation.title} (Branch)`,
        providerId: currentProvider.id,
        parent_conversation_id: sourceConversation.id,
      };

      const newConvoId = await window.electron.createConversation(
        branchedConversation
      );
      await loadConversations();
      setActiveConversationId(newConvoId);
    } catch (err) {
      setError("Failed to create branched conversation");
    }
  };

  const handleSelectConversation = (conversationId: number) => {
    setActiveConversationId(conversationId);
  };

  const handleDeleteConversation = async (conversationId: number) => {
    try {
      await window.electron.deleteConversation(conversationId);
      await loadConversations();

      if (activeConversationId === conversationId) {
        const remainingConvos = conversations.filter(
          (c) => c.id !== conversationId
        );
        setActiveConversationId(remainingConvos[0]?.id || null);
      }
    } catch (err) {
      setError("Failed to delete conversation");
    }
  };

  const handleUpdateConversationTitle = async (
    conversationId: number,
    newTitle: string
  ) => {
    try {
      await window.electron.updateConversationTitle(conversationId, newTitle);
      await loadConversations();
    } catch (err) {
      setError("Failed to update conversation title");
    }
  };

  return (
    <div className="flex flex-col h-full">
      <ResizablePanelGroup direction="vertical">
        <ResizablePanel defaultSize={70} minSize={10}>
          <ResizablePanelGroup direction="horizontal">
            <ResizablePanel defaultSize={20} minSize={10} maxSize={60}>
              <ConversationTree
                conversations={conversations}
                onNewConversation={onNewConversation}
                onSelectConversation={handleSelectConversation}
                onDeleteConversation={handleDeleteConversation}
              />
            </ResizablePanel>
            <ResizableHandle withHandle />
            <ResizablePanel defaultSize={80} minSize={10}>
              <ChatTitle
                id={activeConversationId}
                onUpdateTitle={handleUpdateConversationTitle}
                onDeleteConversation={handleDeleteConversation}
                // onBranchConversation={handleBranchConversation}
                title={
                  conversations?.find((item) => item.id == activeConversationId)
                    ?.title
                }
              />
              <ChatScrollArea
                messages={
                  conversations?.find((item) => item.id == activeConversationId)
                    ?.messages
                }
                isLoading={isLoading}
                provider={currentProvider}
                user={user?.name ?? ""}
                onBranchConversation={handleBranchConversation}
              />
            </ResizablePanel>
          </ResizablePanelGroup>
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel minSize={30} defaultSize={30}>
          <div className="flex flex-col gap-2 h-full overflow-auto px-40">
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
