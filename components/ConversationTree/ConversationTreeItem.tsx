import { ChevronRight } from "lucide-react";
import { cn } from "../../src/lib/utils";
import { Button } from "../../components/ui/button";
import { Node } from "./ConversationTree";

interface Props {
  node: Node;
  isOpen: boolean;
  onToggleOpen: () => void;
  toggleNodeOpen: (id: number) => void;
  openNodes: Record<number, boolean>;
  onSelectConversation: (conversationId: number) => void;
}

export default function ConversationTreeItem(props: Props) {
  const {
    node,
    onSelectConversation,
    isOpen,
    onToggleOpen,
    openNodes,
    toggleNodeOpen,
  } = props;

  const hasChildren = node.nodes && node.nodes.length > 0;

  return (
    <div className="flex flex-col">
      <div className="flex items-center">
        {hasChildren && (
          <button
            onClick={onToggleOpen}
            className="flex items-center justify-center"
          >
            <ChevronRight
              className={cn(
                "size-4 text-gray-500 transition-transform duration-200",
                isOpen && "rotate-90"
              )}
            />
          </button>
        )}
        <div className={cn(hasChildren ? "pl-0" : "pl-4")}>
          <Button
            variant="ghost"
            className="text-xs gap-0 px-1"
            size="sm"
            onClick={() => onSelectConversation(node.id)}
          >
            {node.name}
          </Button>
        </div>
      </div>

      {hasChildren && isOpen && (
        <div className="flex flex-row w-full min-h-full pl-3">
          <div className="w-[1px] bg-gray-300" />
          <div className="flex-1 pl-2">
            {node.nodes?.map((childNode) => (
              <ConversationTreeItem
                node={childNode}
                key={childNode.id}
                isOpen={!!openNodes[childNode.id]}
                openNodes={openNodes}
                toggleNodeOpen={toggleNodeOpen}
                onToggleOpen={() => toggleNodeOpen(childNode.id)}
                onSelectConversation={onSelectConversation}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
