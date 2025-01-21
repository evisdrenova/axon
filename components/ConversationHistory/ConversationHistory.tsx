import { Button } from "../../components/ui/button";
import { TestConversation } from "../../src/pages/Home";
import ConversationHistoryItem from "./ConversationHistoryItem";

interface Props {
  messages: TestConversation[];
  handleNewConversation: () => void;
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

export default function ConversationHistory(props: Props) {
  const { messages, handleNewConversation } = props;
  console.log("messgaes", messages);
  return (
    <div className="p-4 h-[600px] w-[400px] overflow-y-auto flex flex-col gap-4">
      <div>
        <Button variant="default" onClick={handleNewConversation}>
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
