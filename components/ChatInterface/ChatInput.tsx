"use client";

import { ArrowUp } from "lucide-react";
import { Textarea } from "../ui/textarea";
import { Button } from "../ui/button";
import { Provider } from "../../src/types";

interface Props {
  inputValue: string;
  setInputValue: (val: string) => void;
  currentProvider: Provider;
  isLoading: boolean;
  handleSubmit: (e: React.FormEvent) => Promise<void>;
}

export default function ChatInput(props: Props) {
  const {
    handleSubmit,
    inputValue,
    setInputValue,
    currentProvider,
    isLoading,
  } = props;

  return (
    <div className="flex flex-col h-full">
      <form onSubmit={handleSubmit} className="flex flex-row flex-1">
        <Textarea
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="What are you working on?"
          className="placeholder:text-gray-900/50 placeholder:text-xs flex-1 w-full resize-none p-3 text-sm border-0 focus:ring-0 focus-visible:ring-0 shadow-none mb-20 "
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSubmit(e);
            }
          }}
        />
        <div className="flex justify-start">
          <Button
            onClick={handleSubmit}
            size="sm"
            disabled={!inputValue || !currentProvider || isLoading}
            className="rounded-lg p-2 transition-colors bg-main-900 text-main-50"
          >
            <ArrowUp className="w-4 h-4" />
          </Button>
        </div>
      </form>
    </div>
  );
}
