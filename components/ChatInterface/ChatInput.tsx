"use client";

import { ArrowRight, ArrowUp, Paperclip, Send } from "lucide-react";
import { Textarea } from "../ui/textarea";
import { cn } from "../../src/lib/utils";
import useAutoResizeTextarea from "../../hooks/useAutoResizeTextArea";
import { Button } from "../ui/button";
import { Provider } from "../../src/types";
import { useEffect } from "react";

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

  const { textareaRef, adjustHeight } = useAutoResizeTextarea({
    minHeight,
    maxHeight,
  });

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  return (
    <div className="w-full pt-4 relative flex flex-col">
      <div
        className="overflow-y-auto w-full"
        style={{ maxHeight: `${maxHeight}px` }}
      >
        <form onSubmit={handleSubmit} className="flex w-full">
          <div className="relative flex-1">
            <Textarea
              value={inputValue}
              placeholder="What are you working on?"
              className="w-full py-3 placeholder:text-main/40 placeholder:text-xs resize-none leading-[1.2] pr-10 border-0 focus:ring-0 focus-visible:ring-0 text-xs shadow-none"
              ref={textareaRef}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
              onChange={(e) => {
                setInputValue(e.target.value);
                adjustHeight();
              }}
              rows={1}
            />
            <div className="absolute right-2 bottom-2">
              <Button
                onClick={handleSubmit}
                variant="ghost"
                disabled={!inputValue || !currentProvider || isLoading}
                className={cn(
                  "rounded-lg p-2 transition-colors",
                  inputValue ? "bg-foreground text-muted" : "text-main-400"
                )}
              >
                <ArrowUp className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
