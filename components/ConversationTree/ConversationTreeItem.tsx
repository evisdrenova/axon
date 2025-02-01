import { ChevronRight, CornerDownRight } from "lucide-react";
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
  activeConversationId: number;
}

export default function ConversationTreeItem(props: Props) {
  const {
    node,
    onSelectConversation,
    isOpen,
    onToggleOpen,
    openNodes,
    toggleNodeOpen,
    activeConversationId,
  } = props;

  const hasChildren = node.nodes && node.nodes.length > 0;

  const isActive = node.id == activeConversationId;

  const isChild = node.parentId;

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
        <div className={cn(hasChildren || isChild ? "pl-0" : "pl-4", "w-full")}>
          <Button
            variant="ghost"
            className={cn(
              "text-xs gap-0 px-1 w-full flex justify-start",
              isActive && "bg-gray-200"
            )}
            size="sm"
            onClick={() => onSelectConversation(node.id)}
          >
            {node.name}
          </Button>
        </div>
      </div>
      {isOpen && (
        <div className="flex flex-row w-full min-h-full pl-5">
          <ChildrenArrow />
          <div className="flex-1">
            {node.nodes?.map((childNode) => (
              <ConversationTreeItem
                node={childNode}
                key={childNode.id}
                isOpen={!!openNodes[childNode.id]}
                openNodes={openNodes}
                toggleNodeOpen={toggleNodeOpen}
                onToggleOpen={() => toggleNodeOpen(childNode.id)}
                onSelectConversation={onSelectConversation}
                activeConversationId={activeConversationId}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ChildrenArrow() {
  return (
    <div className="flex-shrink-0">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="21"
        height="16"
        viewBox="0 0 21 16"
        fill="none"
      >
        <path
          d="M1 1V11.5C1 13.8333 2.58333 15 5.75 15H20"
          stroke="black"
          stroke-linecap="round"
        />
      </svg>
    </div>
  );
}
