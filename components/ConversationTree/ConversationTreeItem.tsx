import { ChevronRight } from "lucide-react";
import { cn } from "../../src/lib/utils";
import { Button } from "../../components/ui/button";
import { Node } from "./ConversationTree";
import { useRef, useState, useEffect } from "react";

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

  const childHeightRef = useRef<HTMLDivElement>(null);
  const [childHeight, setChildHeight] = useState<number>(0);

  useEffect(() => {
    const updateHeight = () => {
      if (childHeightRef.current && isOpen) {
        // If there's only one child, keep the SVG height fixed
        if (node.nodes.length === 1) {
          console.log("only one");
          setChildHeight(0); // Height matching the ChildrenArrow SVG
        } else {
          // For multiple children, calculate dynamic height
          console.log("not just one");
          const totalHeight =
            childHeightRef.current.getBoundingClientRect().height;
          const extraHeight = 16;
          setChildHeight((totalHeight + extraHeight) / 1.5);
        }
      } else {
        setChildHeight(0);
      }
    };

    updateHeight();

    const resizeObserver = new ResizeObserver(updateHeight);
    if (childHeightRef.current) {
      resizeObserver.observe(childHeightRef.current);
    }

    return () => {
      resizeObserver.disconnect();
    };
  }, [isOpen, node.nodes, openNodes]);

  console.log("childrHeight", childHeight);
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
              "text-xs gap-0 px-1 w-full flex justify-start py-0 h-8",
              isActive && "bg-primary"
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
          <div className="relative flex flex-col">
            {node.nodes.length > 1 && (
              <svg
                width="21"
                height={childHeight}
                fill="none"
                className="absolute left-0 stroke-current"
                style={{ top: "-8px" }} // Adjust this value to align with the first child's connection
              >
                <path
                  d={`M 1 0 L 1 ${childHeight}`}
                  stroke="#7D7D7D"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
            )}
            <div className="flex flex-col gap-1" ref={childHeightRef}>
              {node.nodes?.map((childNode) => (
                <div className="flex flex-row gap-0" key={childNode.id}>
                  <ChildrenArrow />
                  <ConversationTreeItem
                    node={childNode}
                    isOpen={!!openNodes[childNode.id]}
                    openNodes={openNodes}
                    toggleNodeOpen={toggleNodeOpen}
                    onToggleOpen={() => toggleNodeOpen(childNode.id)}
                    onSelectConversation={onSelectConversation}
                    activeConversationId={activeConversationId}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ChildrenArrow() {
  return (
    <div className="flex-shrink-0 bg-background">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="21"
        height="17"
        viewBox="0 0 21 17"
        fill="none"
      >
        <path
          d="M1 1V12.25C1 14.75 2.58333 16 5.75 16H20"
          strokeWidth="1.5"
          stroke="#7D7D7D"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}
