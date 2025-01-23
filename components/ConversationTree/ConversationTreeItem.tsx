import { useState } from "react";
import { ChevronRight, Folder, File, MessageSquare } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "../../src/lib/utils";

type Node = {
  name: string;
  nodes?: Node[];
};

interface Props {
  node: Node;
}

export default function ConversationTreeItem(props: Props) {
  const { node } = props;

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
      <ConversationTreeItem node={node} key={node.name} />
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
            {children}
          </motion.ul>
        )}
      </AnimatePresence>
    );
  };

  return (
    <li key={node.name}>
      <span className="flex items-center gap-1.5 py-1">
        {node.nodes && node.nodes.length > 0 && (
          <button onClick={() => setIsOpen(!isOpen)} className="p-1 -m-1">
            <ChevronIcon />
          </button>
        )}

        {node.nodes ? (
          <MessageSquare
            className={cn(
              node.nodes.length === 0 ? "ml-[22px]" : "",
              `size-4 text-gray-600 `
            )}
          />
        ) : (
          <File className="ml-[22px] size-6 text-gray-900" />
        )}
        {node.name}
      </span>
      <ChildrenList />
    </li>
  );
}
