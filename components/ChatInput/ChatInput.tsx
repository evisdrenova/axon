"use client";

import { Globe, Paperclip, Send } from "lucide-react";
import { useState } from "react";
import { Textarea } from "../../components/ui/textarea";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "../../src/lib/utils";
import useAutoResizeTextarea from "../../hooks/useAutoResizeTextArea";
import { Button } from "../../components/ui/button";
import { Provider } from "../../src/types";

interface Props {
  minHeight?: number;
  maxHeight?: number;
  onFileSelect?: (file: File) => void;
  inputValue: string;
  setInputValue: (val: string) => void;
  currentProvider: Provider;
  isLoading: boolean;
  handleSubmit: (e: React.FormEvent) => Promise<void>;
}

export default function ChatInput(props: Props) {
  const {
    minHeight = 48,
    maxHeight = 164,
    handleSubmit,
    onFileSelect,
    inputValue,
    setInputValue,
    currentProvider,
    isLoading,
  } = props;
  const [value, setValue] = useState("");
  const { textareaRef, adjustHeight } = useAutoResizeTextarea({
    minHeight,
    maxHeight,
  });
  const [showSearch, setShowSearch] = useState(true);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileSelect?.(file);
    }
  };

  return (
    <div className={cn("w-full py-4")}>
      <div className="relative max-w-xl w-full mx-auto">
        <div className="relative flex flex-col">
          <div
            className="overflow-y-auto"
            style={{ maxHeight: `${maxHeight}px` }}
          >
            <form onSubmit={handleSubmit} className="flex gap-2">
              <Textarea
                value={value}
                placeholder={"What are you working on?"}
                className="w-full px-4 py-3 placeholder:text-main/40 resize-none  leading-[1.2]"
                ref={textareaRef}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    //   handleSubmit
                  }
                }}
                onChange={(e) => {
                  setInputValue(e.target.value);
                  adjustHeight();
                }}
              />
              <div className="absolute right-3 bottom-3">
                <Button
                  onClick={handleSubmit}
                  variant="ghost"
                  disabled={!inputValue || !currentProvider || isLoading}
                  className={cn(
                    "rounded-lg p-2 transition-colors",
                    value ? "bg-foreground text-muted" : "text-main-400"
                  )}
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </form>
          </div>
          <div className="h-12 bg-black/5 dark:bg-white/5 rounded-b-xl">
            <div className="absolute left-3 bottom-3 flex items-center gap-2">
              <label className="cursor-pointer rounded-lg p-2">
                <input
                  type="file"
                  className="hidden"
                  onChange={handleFileChange}
                />
                <Paperclip className="w-4 h-4 text-black/40 dark:text-white/40 hover:text-foreground dark:hover:text-white transition-colors" />
              </label>{" "}
            </div>
            <div className="absolute right-3 bottom-3">
              <Button
                onClick={handleSubmit}
                variant="ghost"
                disabled={!inputValue || !currentProvider || isLoading}
                className={cn(
                  "rounded-lg p-2 transition-colors",
                  value ? "bg-foreground text-main-100" : "text-main-400"
                )}
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
