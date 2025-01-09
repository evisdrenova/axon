import Anthropic from "@anthropic-ai/sdk";
import ReactMarkdown from "react-markdown";
import { FilterThinkingContent } from "./utils";
import { cn } from "../../src/lib/utils";

export default function RenderMessageContent(
  content: string | Anthropic.ContentBlock[],
  role: string
) {
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
      components={{
        // Basic elements
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

        // Other elements
        strong: ({ children }) => (
          <span className="text-gray-600 font-mono">{children}</span>
        ),
        table: ({ children }) => (
          <div className="overflow-x-auto my-4">
            <table className="min-w-full divide-y divide-gray-200 border">
              {children}
            </table>
          </div>
        ),
        thead: ({ children }) => (
          <thead className="bg-gray-50">{children}</thead>
        ),
        tbody: ({ children }) => (
          <tbody className="bg-white divide-y divide-gray-200">
            {children}
          </tbody>
        ),
        tr: ({ children }) => <tr className="hover:bg-gray-50">{children}</tr>,
        th: ({ children }) => (
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r last:border-r-0">
            {children}
          </th>
        ),
        td: ({ children }) => (
          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 border-r last:border-r-0">
            {children}
          </td>
        ),
      }}
    >
      {markdown}
    </ReactMarkdown>
  );
}
