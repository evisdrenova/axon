import ReactMarkdown from "react-markdown";
import { FilterThinkingContent } from "./utils";
import { cn, toTitleCase } from "../lib/utils";
import { ScrollArea } from "../../components/ui/scroll-area";
import { Message, Provider } from "../types";
import remarkGfm from "remark-gfm";
import { Check, Copy, Split } from "lucide-react";
import { Button } from "../../components/ui/button";
import { useState } from "react";
import Anthropic from "@anthropic-ai/sdk";
import Spinner from "../../components/ui/Spinner";

interface Props {
  messages: Message[];
  isLoading: boolean;
  provider: Provider;
  user: string;
  activeConversationId: number;
  onBranchConversation: (conversationId: number, messageId: number) => void;
  isBranchLoading: boolean;
}

export default function ChatScrollArea(props: Props) {
  const {
    messages,
    isLoading,
    provider,
    user,
    onBranchConversation,
    activeConversationId,
    isBranchLoading,
  } = props;
  const [copied, setCopied] = useState<boolean>(false);

  const copyToClipBoard = async (
    content: string | Anthropic.ContentBlock[]
  ) => {
    if (typeof content === "string") {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // const summary = extractSummary(messages)

  return (
    <ScrollArea className="h-full w-full">
      <div className="space-y-4 p-4">
        {messages?.map((message, index) => (
          <div
            key={index}
            className={cn(
              message.role === "user" ? "justify-end" : "justify-start w-[60%]",
              `flex`
            )}
          >
            <div className="flex flex-col">
              <div
                className={cn(
                  message.role === "user" ? "justify-end" : "justify-start",
                  `flex px-2 `
                )}
              >
                <RenderMessageMetadata
                  message={message}
                  provider={provider}
                  user={user}
                />
              </div>
              <div className="flex flex-row gap-1">
                <div
                  className={cn(
                    message.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted",
                    `rounded-lg px-4 py-2`
                  )}
                >
                  <RenderMessageContent message={message} />
                </div>
                {message.role == "assistant" && (
                  <div className="flex flex-col gap-2">
                    <Button
                      variant="ghost"
                      onClick={() => copyToClipBoard(message.content)}
                    >
                      {copied ? (
                        <Check className="text-green-500 w-2 h-2" />
                      ) : (
                        <Copy />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() =>
                        onBranchConversation(activeConversationId, message.id)
                      }
                    >
                      {isBranchLoading ? (
                        <Spinner />
                      ) : (
                        <Split className="rotate-90" />
                      )}
                    </Button>
                  </div>
                )}
              </div>
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
  );
}
interface MessageContentProps {
  message: Message;
}

export function RenderMessageContent(props: MessageContentProps) {
  const { message } = props;

  if (typeof message.content === "string") {
    return renderMarkdown(message.content, message.role);
  } else if (Array.isArray(message.content)) {
    return message.content.map((block) => {
      if (block.type === "text") {
        return renderMarkdown(block.text || "", message.role);
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

interface MessageMetadataProps {
  message: Message;
  provider: Provider;
  user: string;
}

function RenderMessageMetadata(props: MessageMetadataProps) {
  const { message, provider, user } = props;
  if (message.role == "user") {
    return (
      <div className="text-xs flex flex-row gap-1">
        <div> {user}</div>
        <div>@</div>
        <NiceDate date={message.createdAt} />
      </div>
    );
  } else {
    return (
      <div className="flex flex-row items-center gap-1 text-xs">
        <div>{toTitleCase(provider?.type ?? "")}</div> @
        <NiceDate date={message.createdAt} />
      </div>
    );
  }
}

interface DateProps {
  date: string;
}

function NiceDate(props: DateProps) {
  const { date } = props;
  const prettyDate = formatDateTime(date);

  return (
    <time dateTime={date} className="text-xs text-gray-800">
      {prettyDate}
    </time>
  );
}

function formatDateTime(dateString?: string): string {
  if (!dateString) return "";

  const isoString = dateString.replace(" ", "T");
  const date = new Date(isoString);

  return date.toLocaleString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

// function extractSummary(messages:Message[]){
//   const summaryRegex = /<summary>.*?<\/summary>/s;

//   for (const message of messages) {
//     for (const content of message.content) {
//       if (content.type === 'text' && summaryRegex.test(content.text)) {
//         return message;
//       }
//     }
//   }
//   return null;
// }
