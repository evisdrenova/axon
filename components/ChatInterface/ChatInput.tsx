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
  chatInputRef: RefObject<HTMLTextAreaElement>;
  containerHeight: number;
}

const BASE_HEIGHT = 88; // Minimum starting height

export default function ChatInput(props: Props) {
  const {
    handleSubmit,
    inputValue,
    setInputValue,
    currentProvider,
    isLoading,
    containerHeight,
  } = props;

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [actualHeight, setActualHeight] = useState(BASE_HEIGHT);

  useEffect(() => {
    if (containerRef.current) {
      // const parentHeight =
      //   containerRef.current.parentElement?.clientHeight || 0;
      const ratio = 88 / 900;
      const calculatedHeight = Math.max(ratio * 100, containerHeight);
      console.log("container height", containerHeight);
      setActualHeight(calculatedHeight);
      console.log("ratio height", ratio * 100);
      console.log("Calculated height:", calculatedHeight);
    }
  }, [containerHeight]);

  //TODO: finish fixing the sizing behavior on the chat area
  // as the input area container grows then the text area should grow in heiht as well and then contract as well
  // the resizeable panels are expressed in numbers but we can treat them as percents
  // so we need to transofrm the resiazable height numbers to pixels

  return (
    <div className="w-full relative flex flex-col" ref={containerRef}>
      <div className="w-full">
        <form onSubmit={handleSubmit} className="flex-1">
          <div className="relative h-full">
            <Textarea
              ref={textareaRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="What are you working on?"
              className="w-full resize-none p-3 text-sm border-0 focus:ring-0 focus-visible:ring-0 shadow-none"
              style={{
                minHeight: `${BASE_HEIGHT}px`,
                height: `${actualHeight}%`,
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
            />
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
          </div>
        </form>
      </div>
    </div>
  );
}
