import Anthropic from "@anthropic-ai/sdk";
import ReactMarkdown from "react-markdown";
import { FilterThinkingContent } from "./utils";
import { cn } from "../../src/lib/utils";
import { ScrollArea } from "../../components/ui/scroll-area";
import { Message } from "../../src/types";
import remarkGfm from "remark-gfm";

interface Props {
  messages: Message[];
  isLoading: boolean;
}

export default function ChatInterface(props: Props) {
  const { messages, isLoading } = props;
  return (
    <div className="flex flex-col">
      <ScrollArea className="h-[500px]">
        <div className="space-y-4">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${
                message.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`rounded-lg px-4 py-2 max-w-[80%] ${
                  message.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted"
                }`}
              >
                {renderMessageContent(message)}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-muted rounded-lg px-4 py-2">
                <div className="animate-pulse">Analyzing...</div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

export function renderMessageContent(message: {
  content: string | Anthropic.ContentBlock[];
  role: string;
}) {
  const content = message.content;
  const role = message.role;

  if (typeof content === "string") {
    return renderMarkdown(content, role);
  } else if (Array.isArray(content)) {
    return content.map((block) => {
      if (block.type === "text") {
        return renderMarkdown(block.text || "", role);
      }
      return null;
    });
  }
  return null;
}

function renderMarkdown(content: string, role: string) {
  const markdown = FilterThinkingContent(content);
  return (
    <ReactMarkdown
      className="prose max-w-none"
      remarkPlugins={[remarkGfm]}
      components={{
        p: ({ children }: { children: any }) => (
          <p className={cn(role == "user" ? "text-gray-100" : "text-gray-900")}>
            {children}
          </p>
        ),
        ul: ({ children }) => <ul>{children}</ul>,
        li: ({ children }: { children: any }) => {
          return (
            <li className="flex items-start space-x-2 py-1 rounded-lg">
              <div className="min-w-4">•</div>
              <div>
                <span>{children}</span>
              </div>
            </li>
          );
        },
        strong: ({ children }) => (
          <span className="text-gray-600 ">{children}</span>
        ),
        table: ({ children }) => (
          <div className="overflow-x-auto  py-2">
            <table className="w-full border-collapse border border-gray-200 table-fixed md:table-auto ">
              {children}
            </table>
          </div>
        ),
        thead: ({ children }) => (
          <thead className="bg-gray-50 border-b border-gray-200">
            {children}
          </thead>
        ),
        tbody: ({ children }) => <tbody className="bg-white">{children}</tbody>,
        tr: ({ children }) => (
          <tr className="border-b border-gray-200 last:border-b-0">
            {children}
          </tr>
        ),
        th: ({ children }) => (
          <th
            scope="col"
            className="px-3 py-2 text-left text-xs font-medium text-gray-800 uppercase break-words"
          >
            {children}
          </th>
        ),
        td: ({ children }) => (
          <td className="px-3 py-2 text-xs text-gray-800 break-words">
            {children}
          </td>
        ),
      }}
    >
      {markdown}
    </ReactMarkdown>
  );
}
