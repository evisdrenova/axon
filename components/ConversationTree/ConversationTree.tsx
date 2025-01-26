import { Conversation } from "../../src/types";
import { Button } from "../ui/button";
import ConversationTreeItem from "./ConversationTreeItem";
import { useState, useMemo } from "react";
interface Props {
  conversations: Conversation[];
  onNewConversation: (parentId?: string) => void;
  onBranchConversation: (conversationId: number) => void;
  onSelectConversation: (conversationId: number) => void;
  onDeleteConversation: (convoId: number) => void;
}

export interface Node {
  id: number;
  parentId?: number;
  name: string;
  nodes?: Node[];
}

export default function ConversationTree(props: Props) {
  const {
    conversations,
    onNewConversation,
    onBranchConversation,
    onSelectConversation,
  } = props;
  // tracks which nodes are open in the convo tree
  const [openNodes, setOpenNodes] = useState<Record<number, boolean>>({});

  const toggleNodeOpen = (id: number) => {
    setOpenNodes((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const nodes = useMemo(
    () => convertConversationsToNodes(conversations),
    [conversations]
  );

  console.log("nodes", nodes);
  return (
    <div className="p-4 h-[600px] w-[400px] overflow-y-auto flex flex-col gap-4">
      <div>
        <Button variant="default" onClick={() => onNewConversation()}>
          + New Conversation
        </Button>
      </div>
      <ul>
        {nodes.map((node) => (
          <ConversationTreeItem
            node={node}
            key={node.id}
            isOpen={!!openNodes[node.id]}
            openNodes={openNodes}
            toggleNodeOpen={toggleNodeOpen}
            onToggleOpen={() => toggleNodeOpen(node.id)}
            onSelectConversation={onSelectConversation}
          />
        ))}
      </ul>
    </div>
  );
}

function convertConversationsToNodes(convos: Conversation[]): Node[] {
  let nodesArr: Node[] = [];

  for (const convo of convos) {
    const node: Node = {
      id: convo.id,
      parentId: convo.parent_conversation_id,
      name: convo.title,
      nodes: [],
    };

    if (!convo.parent_conversation_id) {
      // This is a root node
      nodesArr.push(node);
    } else {
      // Find parent node recursively
      const parent = findNodeById(nodesArr, convo.parent_conversation_id);
      if (parent) {
        if (!parent.nodes) parent.nodes = [];
        parent.nodes.push(node);
      }
    }
  }

  return nodesArr;
}

function findNodeById(nodes: Node[], id: number): Node | undefined {
  for (const node of nodes) {
    if (node.id === id) return node;
    if (node.nodes) {
      const found = findNodeById(node.nodes, id);
      if (found) return found;
    }
  }
  return undefined;
}
