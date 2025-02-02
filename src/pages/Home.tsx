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
import { Dialog, DialogContent, DialogTitle } from "../../components/ui/dialog";
import Models from "./Models";
import Tools from "./Tools";
import { Button } from "../../components/ui/button";
import { Wrench } from "lucide-react";
import { toast } from "sonner";
import TitleBar from "../../components/Titlebar/Titlebar";

const SETTINGS = {
  ACTIVE_CONVERSATION: "activeConversation",
  SELECTED_PROVIDER: "selectedProvider",
} as const;

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<
    number | null
  >(null);
  const [selectedProvider, setSelectedProvider] = useState<string>("");
  const [currentProvider, setCurrentProvider] = useState<Provider | null>(null);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isBranchLoading, setIsBranchLoading] = useState<boolean>(false);
  const [openModels, setOpenModels] = useState<boolean>(false);
  const [openTools, setOpenTools] = useState<boolean>(false);

  const loadProviders = async () => {
    try {
      const providers = await window.electron.getProviders();
      setProviders(providers);

      // Load the previously selected provider from settings
      const savedProviderId = await window.electron.getSettings<number>(
        SETTINGS.SELECTED_PROVIDER
      );

      if (savedProviderId) {
        const savedProvider = providers.find((p) => p.id === savedProviderId);
        if (savedProvider) {
          setSelectedProvider(savedProviderId.toString());
          setCurrentProvider(savedProvider);
          window.electron.selectProvider(savedProvider);
          return;
        }
      }

      // Fall back to default provider if no saved provider or saved provider not found
      if (providers.length > 0) {
        const defaultProvider = providers[0];
        setSelectedProvider(defaultProvider.id?.toString() || "");
        setCurrentProvider(defaultProvider);
        window.electron.selectProvider(defaultProvider);
        // Save the default selection
        await window.electron.setSettings(
          SETTINGS.SELECTED_PROVIDER,
          defaultProvider.id?.toString()
        );
      }
    } catch (err) {
      toast.error("Failed to load providers", err);
    }
  };

  const loadUser = async () => {
    try {
      const user = await window.electron.getUser();
      setUser(user);
    } catch (err) {
      toast.error("Error loading user:", err);
    }
  };

  const loadConversations = async () => {
    try {
      const convos = await window.electron.getConversations();
      setConversations(convos);

      // Load the previously active conversation from settings
      const savedConversationId = await window.electron.getSettings<number>(
        SETTINGS.ACTIVE_CONVERSATION
      );

      if (
        savedConversationId &&
        convos.some((c) => c.id === savedConversationId)
      ) {
        setActiveConversationId(savedConversationId);
      } else if (convos.length > 0) {
        // Fall back to first conversation if saved one not found
        setActiveConversationId(convos[0].id);
        // Save the default selection
        await window.electron.setSettings(
          SETTINGS.ACTIVE_CONVERSATION,
          convos[0].id
        );
      }
    } catch (err) {
      toast.error("Error loading conversations:", err);
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

  const handleProviderSelect = async (providerValue: string) => {
    if (providerValue === "new-model") {
      setOpenModels(true);
      try {
        const updatedProviders = await window.electron.getProviders();
        setProviders(updatedProviders);

        const newProvider = updatedProviders[updatedProviders.length - 1];
        if (newProvider) {
          setSelectedProvider(newProvider.id?.toString() || "");
          setCurrentProvider(newProvider);
          window.electron.selectProvider(newProvider);
          // Save the new selection
          await window.electron.setSettings(
            SETTINGS.SELECTED_PROVIDER,
            newProvider.id?.toString()
          );
        }
      } catch (err) {
        toast.error("Failed to load updated providers", err);
      }
      return;
    }

    setSelectedProvider(providerValue);
    const provider = providers.find((p) => p.id?.toString() === providerValue);
    try {
      await window.electron.selectProvider(provider);
      setCurrentProvider(provider || null);
      // Save the selection
      if (provider?.id) {
        await window.electron.setSettings(
          SETTINGS.SELECTED_PROVIDER,
          provider.id.toString()
        );
      }
    } catch (err) {
      toast.error("there was an error setting the provider", err);
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

    const trimmedInput = inputValue.trim();

    setIsLoading(true);
    setInputValue("");

    // create optimistic user message
    const tempId = generateTempId(messages);

    const optimisticUserMessage: Message = {
      id: Date.now(),
      role: "user",
      content: trimmedInput,
      conversationId: activeConversationId,
      createdAt: new Date().toISOString(),
    };

    // optimistically update the chat window
    setConversations((prevConversations) =>
      prevConversations.map((conversation) => {
        if (conversation.id === activeConversationId) {
          return {
            ...conversation,
            messages: [...conversation.messages, optimisticUserMessage],
          };
        }
        return conversation;
      })
    );

    try {
      const userMessage: Message = {
        role: "user",
        content: trimmedInput,
        conversationId: activeConversationId,
      };

      // Save user message
      try {
        await window.electron.saveMessage(userMessage);
      } catch (err) {
        toast.error("there was an error setting the provider", err);
      }

      // Get chat response
      let response;
      try {
        response = await window.electron.chat([...messages, userMessage]);
      } catch (err) {
        // If chat fails, we should delete the saved user message
        try {
          await window.electron.deleteMessage(userMessage.id!);
        } catch (cleanupErr) {
          toast.error("Failed to cleanup user message:", cleanupErr);
        }
        toast.error("Failed to cleanup user message:", err);
      }

      const assistantMessage: Message = {
        role: "assistant",
        content: response,
        conversationId: activeConversationId,
      };

      // Save assistant message
      try {
        await window.electron.saveMessage(assistantMessage);
      } catch (err) {
        // If we can't save the assistant message, cleanup the user message
        try {
          await window.electron.deleteMessage(userMessage.id!);
        } catch (cleanupErr) {
          toast.error(
            "Failed to cleanup after assistant message error:",
            cleanupErr
          );
        }
        toast.error("Failed to save assistant response");
      }

      await loadConversations();
    } catch (err) {
      // Roll back optimistic update
      setConversations((prevConversations) =>
        prevConversations.map((conversation) => {
          if (conversation.id === activeConversationId) {
            return {
              ...conversation,
              messages: conversation.messages.filter(
                (msg) => msg.id !== tempId
              ),
            };
          }
          return conversation;
        })
      );
      toast.error(err.message || "Failed to get response");
    } finally {
      setIsLoading(false);
    }
  };

  function generateTempId(messages: Message[]): number {
    if (!messages.length) return 1;
    return Math.max(...messages.map((m) => m.id ?? 0)) + 1;
  }

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
      toast.error("Failed to create new conversation");
    }
  };

  const handleBranchConversation = async (
    conversationId: number,
    messageId: number
  ) => {
    if (!currentProvider) return;

    const sourceConversation = conversations.find(
      (c) => c.id === conversationId
    );
    if (!sourceConversation) return;

    const timestamp = new Date().toLocaleString("en-US", {
      hour: "numeric",
      minute: "numeric",
      second: "numeric",
      hour12: true,
    });

    try {
      const branchedConversation: Partial<Conversation> = {
        title: `${sourceConversation.title} (Branch ${timestamp})`,
        providerId: currentProvider.id,
        parent_conversation_id: sourceConversation.id,
      };

      const newConvoId = await window.electron.createConversation(
        branchedConversation
      );
      const sourceMessage = sourceConversation.messages.find(
        (m) => m.id === messageId
      );

      if (sourceMessage) {
        console.log("source", sourceConversation.messages);
        // attempts to summarize the context in order to reduce the context window length
        setIsBranchLoading(true);
        // const summary = await window.electron.summarizeContext(
        //   sourceConversation.messages
        // );

        setIsBranchLoading(false);
        const messages: Message[] = [
          // {
          //   role: "assistant",
          //   content: summary,
          //   conversationId: newConvoId,
          // },
          {
            role: sourceMessage.role,
            content: sourceMessage.content,
            conversationId: newConvoId,
          },
        ];

        await window.electron.saveMessages(messages);

        const newConversation: Conversation = {
          id: newConvoId,
          title: branchedConversation.title,
          providerId: currentProvider.id,
          parent_conversation_id: sourceConversation.id,
          messages: messages,
        };

        setConversations((prev) => [newConversation, ...prev]);
      }

      await loadConversations();
      setActiveConversationId(newConvoId);
      // This should only show the loading spinner in the chatscroll area for the message that we're trying to branch
      setIsBranchLoading(false);
    } catch (err) {
      toast.error("Failed to create branched conversation", err);
    }
  };

  const handleSelectConversation = async (conversationId: number) => {
    setActiveConversationId(conversationId);
    try {
      await window.electron.setSettings(
        SETTINGS.ACTIVE_CONVERSATION,
        conversationId
      );
    } catch (err) {
      toast.error("Error saving active conversation:", err);
    }
  };
  const handleDeleteConversation = async (conversationId: number) => {
    try {
      await window.electron.deleteConversation(conversationId);
      await loadConversations();

      // If we're deleting the active conversation
      if (activeConversationId === conversationId) {
        const remainingConvos = conversations.filter(
          (c) => c.id !== conversationId
        );
        const newActiveId = remainingConvos[0]?.id || null;
        setActiveConversationId(newActiveId);

        if (newActiveId) {
          await window.electron.setSettings(
            SETTINGS.ACTIVE_CONVERSATION,
            newActiveId
          );
        } else {
          // If no conversations left, remove the setting
          await window.electron.setSettings(SETTINGS.ACTIVE_CONVERSATION, null);
        }
      }
    } catch (err) {
      toast.error("Failed to delete conversation", err);
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
      toast.error("Failed to update conversation title", err);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <TitleBar
        activeConversation={conversations.find(
          (c) => c.id == activeConversationId
        )}
        onDeleteConversation={handleDeleteConversation}
        onUpdateTitle={handleUpdateConversationTitle}
      />
      <ResizablePanelGroup direction="horizontal">
        <ResizablePanel
          defaultSize={20}
          minSize={10}
          maxSize={60}
          className="border border-border ml-1 mb-1 rounded-lg"
        >
          <ConversationTree
            conversations={conversations}
            onNewConversation={onNewConversation}
            onSelectConversation={handleSelectConversation}
            onDeleteConversation={handleDeleteConversation}
            activeConversationId={activeConversationId}
          />
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel defaultSize={70} minSize={10}>
          <ResizablePanelGroup direction="vertical">
            <ResizablePanel
              defaultSize={80}
              minSize={10}
              className="flex flex-col border border-border rounded-lg mx-1"
            >
              <ChatScrollArea
                messages={
                  conversations?.find((item) => item.id == activeConversationId)
                    ?.messages
                }
                activeConversationId={activeConversationId}
                isLoading={isLoading}
                provider={currentProvider}
                user={user?.name ?? ""}
                onBranchConversation={handleBranchConversation}
                isBranchLoading={isBranchLoading}
              />
            </ResizablePanel>
            <ResizableHandle withHandle />
            <ResizablePanel minSize={20} defaultSize={30}>
              <div className="flex flex-col h-full">
                <div className="flex flex-col flex-1 bg-muted border border-border rounded-lg mx-1 my-1">
                  <div className="pt-2 px-4 space-x-2">
                    <ModelSelect
                      handleProviderSelect={handleProviderSelect}
                      selectedProvider={selectedProvider}
                      providers={providers}
                    />

                    <Button
                      variant="ghost"
                      className="text-xs"
                      size="sm"
                      onClick={() => setOpenTools(true)}
                    >
                      <Wrench size={16} /> Tools
                    </Button>
                  </div>
                  <div className="flex-1 px-4 pb-4 mt-2">
                    <ChatInput
                      inputValue={inputValue}
                      setInputValue={setInputValue}
                      currentProvider={currentProvider}
                      isLoading={isLoading}
                      handleSubmit={handleSubmit}
                    />
                  </div>
                </div>
              </div>
            </ResizablePanel>
          </ResizablePanelGroup>
        </ResizablePanel>
      </ResizablePanelGroup>
      <Dialog
        open={openModels}
        onOpenChange={() => setOpenModels((prev) => !prev)}
      >
        <DialogTitle />
        <DialogContent className="max-w-4xl">
          <Models loadProviders={loadProviders} />
        </DialogContent>
      </Dialog>
      <Dialog
        open={openTools}
        onOpenChange={() => setOpenTools((prev) => !prev)}
      >
        <DialogTitle />
        <DialogContent className="max-w-4xl">
          <Tools />
        </DialogContent>
      </Dialog>
    </div>
  );
}
