"use client";

import { ArrowUp } from "lucide-react";
import { Textarea } from "../ui/textarea";
import { cn } from "../../src/lib/utils";
import { Button } from "../ui/button";
import { Provider } from "../../src/types";
import { RefObject, useEffect, useState, useRef } from "react";

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
      <form onSubmit={handleSubmit} className="relative flex flex-col flex-1">
        <Textarea
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="What are you working on?"
          className="placeholder:text-gray-900/50 placeholder:text-xs flex-1 w-full resize-none p-3 text-sm border-0 focus:ring-0 focus-visible:ring-0 shadow-none mb-20"
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSubmit(e);
            }
          }}
        />

        {/* Send button anchored to the bottom-right within this container */}
        <div className="absolute right-2 bottom-2">
          <Button
            onClick={handleSubmit}
            variant="ghost"
            disabled={!inputValue || !currentProvider || isLoading}
            className="rounded-lg p-2 transition-colors hover:bg-gray-100"
          >
            <ArrowUp className="w-4 h-4" />
          </Button>
        </div>
      </form>
    </div>
  );
}
