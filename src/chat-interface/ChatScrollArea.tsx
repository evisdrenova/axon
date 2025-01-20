import Anthropic from "@anthropic-ai/sdk";
import ReactMarkdown from "react-markdown";
import { FilterThinkingContent } from "./utils";
import { cn, toTitleCase } from "../lib/utils";
import { ScrollArea } from "../../components/ui/scroll-area";
import { Message, Provider } from "../types";
import remarkGfm from "remark-gfm";
import React from "react";

interface Props {
  messages: Message[];
  isLoading: boolean;
  provider: Provider;
  user: string;
}

const mes: Message[] = [
  {
    role: "user",
    content: "can you pull the latest neosync investor deck?",
  },
  {
    role: "assistant",
    content:
      '<thinking>\nTo retrieve the latest neosync investor deck file, the most relevant tool would be filesystem__search_files. It allows searching for files by name pattern within the allowed directories.\n\nThe required parameters for filesystem__search_files are:\n- path: This can likely be inferred as one of the allowed directories, since an investor deck is usually stored in a known location. \n- pattern: We can infer this should contain "neosync" and "investor deck" to find the right file.\n\nThe excludePatterns parameter is optional, so we can omit it.\n\nTo determine the best path to search, we should first call filesystem__list_allowed_directories to see which directories are available on this system. Then we can pick the most likely location for an investor deck.\n</thinking>\nHere is the latest Neosync investor deck from the downloads directory:\n\n[Neosync-InvestorDeck-July2023.pdf](/Users/evisdrenova/downloads/Neosync-InvestorDeck-July2023.pdf)',
  },
  {
    role: "user",
    content: "can you pull the latest neosync investor deck?",
  },
  {
    role: "assistant",
    content:
      '<thinking>\nTo retrieve the latest neosync investor deck file, the most relevant tool would be filesystem__search_files. It allows searching for files by name pattern within the allowed directories.\n\nThe required parameters for filesystem__search_files are:\n- path: This can likely be inferred as one of the allowed directories, since an investor deck is usually stored in a known location. \n- pattern: We can infer this should contain "neosync" and "investor deck" to find the right file.\n\nThe excludePatterns parameter is optional, so we can omit it.\n\nTo determine the best path to search, we should first call filesystem__list_allowed_directories to see which directories are available on this system. Then we can pick the most likely location for an investor deck.\n</thinking>\nHere is the latest Neosync investor deck from the downloads directory:\n\n[Neosync-InvestorDeck-July2023.pdf](/Users/evisdrenova/downloads/Neosync-InvestorDeck-July2023.pdf)',
  },
  {
    role: "user",
    content: "can you pull the latest neosync investor deck?",
  },
  {
    role: "assistant",
    content:
      '<thinking>\nTo retrieve the latest neosync investor deck file, the most relevant tool would be filesystem__search_files. It allows searching for files by name pattern within the allowed directories.\n\nThe required parameters for filesystem__search_files are:\n- path: This can likely be inferred as one of the allowed directories, since an investor deck is usually stored in a known location. \n- pattern: We can infer this should contain "neosync" and "investor deck" to find the right file.\n\nThe excludePatterns parameter is optional, so we can omit it.\n\nTo determine the best path to search, we should first call filesystem__list_allowed_directories to see which directories are available on this system. Then we can pick the most likely location for an investor deck.\n</thinking>\nHere is the latest Neosync investor deck from the downloads directory:\n\n[Neosync-InvestorDeck-July2023.pdf](/Users/evisdrenova/downloads/Neosync-InvestorDeck-July2023.pdf)',
  },
  {
    role: "user",
    content: "can you pull the latest neosync investor deck?",
  },
  {
    role: "assistant",
    content:
      '<thinking>\nTo retrieve the latest neosync investor deck file, the most relevant tool would be filesystem__search_files. It allows searching for files by name pattern within the allowed directories.\n\nThe required parameters for filesystem__search_files are:\n- path: This can likely be inferred as one of the allowed directories, since an investor deck is usually stored in a known location. \n- pattern: We can infer this should contain "neosync" and "investor deck" to find the right file.\n\nThe excludePatterns parameter is optional, so we can omit it.\n\nTo determine the best path to search, we should first call filesystem__list_allowed_directories to see which directories are available on this system. Then we can pick the most likely location for an investor deck.\n</thinking>\nHere is the latest Neosync investor deck from the downloads directory:\n\n[Neosync-InvestorDeck-July2023.pdf](/Users/evisdrenova/downloads/Neosync-InvestorDeck-July2023.pdf)',
  },
  {
    role: "user",
    content: "can you pull the latest neosync investor deck?",
  },
  {
    role: "assistant",
    content:
      '<thinking>\nTo retrieve the latest neosync investor deck file, the most relevant tool would be filesystem__search_files. It allows searching for files by name pattern within the allowed directories.\n\nThe required parameters for filesystem__search_files are:\n- path: This can likely be inferred as one of the allowed directories, since an investor deck is usually stored in a known location. \n- pattern: We can infer this should contain "neosync" and "investor deck" to find the right file.\n\nThe excludePatterns parameter is optional, so we can omit it.\n\nTo determine the best path to search, we should first call filesystem__list_allowed_directories to see which directories are available on this system. Then we can pick the most likely location for an investor deck.\n</thinking>\nHere is the latest Neosync investor deck from the downloads directory:\n\n[Neosync-InvestorDeck-July2023.pdf](/Users/evisdrenova/downloads/Neosync-InvestorDeck-July2023.pdf)',
  },
  {
    role: "user",
    content: "can you pull the latest neosync investor deck?",
  },
  {
    role: "assistant",
    content:
      '<thinking>\nTo retrieve the latest neosync investor deck file, the most relevant tool would be filesystem__search_files. It allows searching for files by name pattern within the allowed directories.\n\nThe required parameters for filesystem__search_files are:\n- path: This can likely be inferred as one of the allowed directories, since an investor deck is usually stored in a known location. \n- pattern: We can infer this should contain "neosync" and "investor deck" to find the right file.\n\nThe excludePatterns parameter is optional, so we can omit it.\n\nTo determine the best path to search, we should first call filesystem__list_allowed_directories to see which directories are available on this system. Then we can pick the most likely location for an investor deck.\n</thinking>\nHere is the latest Neosync investor deck from the downloads directory:\n\n[Neosync-InvestorDeck-July2023.pdf](/Users/evisdrenova/downloads/Neosync-InvestorDeck-July2023.pdf)',
  },
];

export default function ChatScrollArea(props: Props) {
  const { messages, isLoading, provider, user } = props;

  console.log("messages", messages);
  return (
    <ScrollArea className="h-full w-full">
      <div className="space-y-4 px-4">
        {mes.map((message, index) => (
          <div
            key={index}
            className={cn(
              message.role === "user" ? "justify-end" : "justify-start",
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
                {renderMessageMetadat(message.role, provider, user)}
              </div>
              <div
                className={`rounded-lg px-4 py-2  ${
                  message.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted"
                }`}
              >
                {renderMessageContent(message)}
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

function renderMessageMetadat(
  role: string,
  provider: Provider,
  user: string
): React.JSX.Element {
  if (role == "user") {
    return <div className="text-xs">{user}</div>;
  } else {
    return (
      <div className="flex flex-row items-center gap-1 text-xs">
        <div>{toTitleCase(provider?.type ?? "")}</div>
      </div>
    );
  }
}
