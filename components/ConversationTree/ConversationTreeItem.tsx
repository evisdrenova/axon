import { useState } from "react";
import { ChevronRight, Folder, File, MessageSquare } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "../../src/lib/utils";
import { Button } from "../../components/ui/button";
import { Node } from "./ConversationTree";

interface Props {
  node: Node;
  onSelectConversation: (conversationId: number) => void;
}

export default function ConversationTreeItem(props: Props) {
  const { node, onSelectConversation } = props;

  let [isOpen, setIsOpen] = useState(false);

  const ChevronIcon = () => {
    return (
      <motion.span
        animate={{ rotate: isOpen ? 90 : 0 }}
        transition={{ type: "spring", bounce: 0, duration: 0.4 }}
        style={{ display: "flex" }}
      >
        <ChevronRight className="size-4 text-gray-500" />
      </motion.span>
    );
  };

  const ChildrenList = () => {
    const children = node.nodes?.map((node) => (
      <ConversationTreeItem
        node={node}
        key={node.name}
        onSelectConversation={onSelectConversation}
      />
    ));
    return (
      <AnimatePresence>
        {isOpen && (
          <motion.ul
            key="child-list"
            initial={{ height: 0 }}
            animate={{ height: "auto" }}
            exit={{ height: 0 }}
            transition={{ type: "spring", bounce: 0, duration: 0.4 }}
            className="pl-6 overflow-hidden flex flex-col justify-end"
          >
            <div className="flex flex-row items-stretch w-full min-h-full">
              <div className="w-[1px] bg-gray-300 self-stretch" />
              <div className="flex-1 pl-2">{children}</div>
            </div>
          </motion.ul>
        )}
      </AnimatePresence>
    );
  };

  return (
    <li key={node.name}>
      <span className="flex items-center ">
        {node.nodes && node.nodes.length > 0 && (
          <button onClick={() => setIsOpen(!isOpen)}>
            <ChevronIcon />
          </button>
        )}
        {/* 
        {node.nodes ? (
          <MessageSquare
            className={cn(
              node.nodes.length === 0 ? "ml-[22px]" : "",
              `size-4 text-gray-600 `
            )}
          />
        ) : (
          <File className="ml-[22px] size-4 text-gray-900" />
        )} */}
        <div className={cn(node.nodes.length == 0 ? "pl-4" : "pl-0")}>
          <Button
            variant="ghost"
            className="text-xs gap-0 px-1"
            size="sm"
            onClick={() => onSelectConversation(node.id)}
          >
            {node.name}
          </Button>
        </div>
      </span>
      <ChildrenList />
    </li>
  );
}
