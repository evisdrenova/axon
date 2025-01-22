import { Conversation } from "../../src/types";
import { Button } from "../ui/button";
import ConversationHistoryItem from "./ConversationTreeItem";

interface Props {
  conversations: Conversation[];
  activeConversationId: number | null;
  onNewConversation: (parentId?: string) => void;
  onBranchConversation: (conversationId: number) => void;
  onSelectConversation: (conversationId: number) => void;
  onDeleteConversation: (convoId: number) => void;
  onUpdateTitle: (convoId: number, newTitle: string) => void;
}

const nodes: Node[] = [
  {
    name: "Movies",
    nodes: [
      {
        name: "Action",
        nodes: [
          {
            name: "2000s",
            nodes: [{ name: "Gladiator.mp4" }, { name: "The-Dark-Knight.mp4" }],
          },
          { name: "2010s", nodes: [] },
        ],
      },
      {
        name: "Comedy",
        nodes: [{ name: "2000s", nodes: [{ name: "Superbad.mp4" }] }],
      },
      {
        name: "Drama",
        nodes: [{ name: "2000s", nodes: [{ name: "American-Beauty.mp4" }] }],
      },
    ],
  },
  {
    name: "Music",
    nodes: [
      { name: "Rock", nodes: [] },
      { name: "Classical", nodes: [] },
    ],
  },
  { name: "Pictures", nodes: [] },
  {
    name: "Documents",
    nodes: [],
  },
  { name: "passwords.txt" },
];

type Node = {
  name: string;
  nodes?: Node[];
};

export default function ConversationTree(props: Props) {
  const {
    conversations,
    activeConversationId,
    onNewConversation,
    onBranchConversation,
    onSelectConversation,
    onUpdateTitle,
  } = props;
  console.log("messgaes", conversations);
  return (
    <div className="p-4 h-[600px] w-[400px] overflow-y-auto flex flex-col gap-4">
      <div>
        <Button variant="default" onClick={() => onNewConversation()}>
          + New Conversation
        </Button>
      </div>
      <ul>
        {nodes.map((node) => (
          <ConversationHistoryItem node={node} key={node.name} animated />
        ))}
      </ul>
    </div>
  );
}

// const buildConversationTree = (parentId: string | null = null): Conversation[] => {
//   return conversations
//     .filter(conv => conv.parentId === parentId)
//     .map(conv => ({
//       ...conv,
//       children: buildConversationTree(conv.id)
//     }));
// };

// const renderConversation = (conversation: Conversation, depth: number = 0) => {
//   const isActive = conversation.id === activeConversationId;
//   const hasMessages = conversation.messages.length > 0;

//   return (
//     <div key={conversation.id} style={{ marginLeft: `${depth * 20}px` }}>
//       <div
//         className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer hover:bg-gray-100
//           ${isActive ? 'bg-gray-100' : ''}`}
//         onClick={() => onSelectConversation(conversation.id)}
//       >
//         <MessageSquare className="w-4 h-4" />
//         <span className="flex-1 truncate">{conversation.name}</span>
//         {hasMessages && (
//           <Button
//             variant="ghost"
//             size="sm"
//             className="opacity-0 group-hover:opacity-100"
//             onClick={(e) => {
//               e.stopPropagation();
//               onBranchConversation(conversation.id);
//             }}
//           >
//             <Git className="w-4 h-4" />
//           </Button>
//         )}
//       </div>
//       {conversation.children?.map(child => renderConversation(child, depth + 1))}
//     </div>
//   );
// };

// const tree = buildConversationTree();

// return (
//   <div className="flex flex-col h-full p-4">
//     <div className="flex items-center justify-between mb-4">
//       <h2 className="text-lg font-semibold">Conversations</h2>
//       <Button
//         variant="outline"
//         size="sm"
//         onClick={() => onNewConversation()}
//       >
//         <Plus className="w-4 h-4 mr-2" />
//         New Chat
//       </Button>
//     </div>
//     <div className="flex-1 overflow-auto">
//       {tree.map(conv => renderConversation(conv))}
//     </div>
//   </div>
// );
// };
