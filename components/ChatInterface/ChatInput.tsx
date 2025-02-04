"use client";

import {
  ArrowUp,
  Database,
  File,
  FileQuestion,
  FileText,
  Paperclip,
  Table,
  Wrench,
  X,
} from "lucide-react";
import { Textarea } from "../ui/textarea";
import { Button } from "../ui/button";
import { Provider } from "../../src/types";
import ModelSelect from "./ModelSelect";
import { useRef, useState } from "react";

interface FileAttachment {
  file: File;
  type: string;
  preview?: string;
}

interface Props {
  inputValue: string;
  setInputValue: (val: string) => void;
  currentProvider: Provider;
  isLoading: boolean;
  handleSubmit: (
    e: React.FormEvent,
    attachments?: FileAttachment[]
  ) => Promise<void>;
  handleProviderSelect: (providerId: string) => void;
  selectedProvider: string;
  providers: Provider[];
  setOpenTools: (val: boolean) => void;
}

export default function ChatInput(props: Props) {
  const {
    handleSubmit,
    inputValue,
    setInputValue,
    currentProvider,
    isLoading,
    handleProviderSelect,
    selectedProvider,
    providers,
    setOpenTools,
  } = props;

  const [attachments, setAttachments] = useState<FileAttachment[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const detectFileType = async (file: File): Promise<string> => {
    // Basic file type detection
    if (file.type.startsWith("image/")) return "image";
    if (file.type === "application/pdf") return "pdf";
    if (file.type === "text/csv") return "csv";
    if (file.type.includes("spreadsheet") || file.name.endsWith(".xlsx"))
      return "spreadsheet";
    if (file.type.startsWith("text/")) return "text";
    return "unknown";
  };

  const createFilePreview = async (file: File): Promise<string | undefined> => {
    if (file.type.startsWith("image/")) {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });
    }
    return undefined;
  };

  const handleFileSelect = async () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const newAttachments: FileAttachment[] = [];

    for (const file of files) {
      const type = await detectFileType(file);
      const preview = await createFilePreview(file);
      newAttachments.push({ file, type, preview });
    }

    setAttachments([...attachments, ...newAttachments]);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removeAttachment = (index: number) => {
    const updatedAttachments = [...attachments];
    updatedAttachments.splice(index, 1);
    setAttachments(updatedAttachments);
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await handleSubmit(e, attachments);
    setAttachments([]);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex flex-col h-full flex-1 bg-muted border border-border rounded-lg mx-1 my-1">
        <ChatInputToolBar
          handleProviderSelect={handleProviderSelect}
          selectedProvider={selectedProvider}
          providers={providers}
          setOpenTools={setOpenTools}
          onAttachClick={handleFileSelect}
        />
        <div className="p-2">
          <form onSubmit={onSubmit} className="flex flex-col flex-1">
            <Textarea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="What are you working on?"
              className="placeholder:text-primary-foreground/40 placeholder:text-xs text-primary-foreground flex-1 w-full resize-none p-3 text-xs border-0 focus:ring-0 focus-visible:ring-0 shadow-none"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  onSubmit(e);
                }
              }}
            />
            {attachments.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 mt-2">
                {attachments.map((attachment, index) => (
                  <AttachmentPreview
                    key={index}
                    attachment={attachment}
                    onRemove={() => removeAttachment(index)}
                  />
                ))}
              </div>
            )}
            <div className="flex justify-end mt-2">
              <Button
                type="submit"
                size="sm"
                disabled={!inputValue || !currentProvider || isLoading}
                className="rounded-lg p-2"
              >
                <ArrowUp className="w-4 h-4" />
              </Button>
            </div>
          </form>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
            multiple
          />
        </div>
      </div>
    </div>
  );
}

interface AttachmentPreviewProps {
  attachment: FileAttachment;
  onRemove: () => void;
}

function AttachmentPreview({ attachment, onRemove }: AttachmentPreviewProps) {
  return (
    <div className="relative bg-background rounded-md p-2 flex items-center gap-2 max-w-[200px]">
      <Button
        variant="ghost"
        size="sm"
        className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0"
        onClick={onRemove}
      >
        <X className="h-3 w-3" />
      </Button>

      {attachment.preview ? (
        <img
          src={attachment.preview}
          alt="preview"
          className="h-8 w-8 object-cover rounded"
        />
      ) : (
        <div className="h-8 w-8 bg-muted rounded flex items-center justify-center">
          {attachment.type === "pdf" && <FileText className="h-4 w-4" />}
          {attachment.type === "csv" && <Database className="h-4 w-4" />}
          {attachment.type === "spreadsheet" && <Table className="h-4 w-4" />}
          {attachment.type === "text" && <File className="h-4 w-4" />}
          {attachment.type === "unknown" && (
            <FileQuestion className="h-4 w-4" />
          )}
        </div>
      )}
      <div className="flex flex-col min-w-0">
        <p className="text-xs truncate font-medium">{attachment.file.name}</p>
        <p className="text-xs text-muted-foreground">
          {(attachment.file.size / 1024).toFixed(1)} KB
        </p>
      </div>
    </div>
  );
}

interface ChatInputToolBarProps {
  handleProviderSelect: (providerId: string) => void;
  selectedProvider: string;
  providers: Provider[];
  setOpenTools: (val: boolean) => void;
  onAttachClick: () => void;
}

function ChatInputToolBar(props: ChatInputToolBarProps) {
  const {
    handleProviderSelect,
    selectedProvider,
    providers,
    setOpenTools,
    onAttachClick,
  } = props;

  return (
    <div className="pt-2 px-4 space-x-2">
      <Button variant="ghost" size="sm" onClick={onAttachClick}>
        <Paperclip />
      </Button>
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
  );
}
