import { useState, useEffect } from "react";
import { ServerConfig } from "../types";
import { Button } from "../../components/ui/button";
import Spinner from "../../components/ui/Spinner";
import { Trash } from "lucide-react";

export default function Servers() {
  const [servers, setServers] = useState<ServerConfig[] | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  const loadServers = async () => {
    const servers = await window.electron.getServers();
    setServers(servers);
  };

  useEffect(() => {
    loadServers();
  }, []);

  if (servers === null) {
    return <div className="p-4">Loading...</div>;
  }

  if (servers.length === 0 && !showForm) {
    return (
      <div className="p-4">
        <div className="text-center py-8">
          <p className="text-gray-600 mb-4">No servers created yet</p>
          <button
            onClick={() => setShowForm(true)}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Create New Server
          </button>
        </div>
      </div>
    );
  }

  const handleDelete = async (e: React.MouseEvent, pId: number) => {
    e.preventDefault();
    setIsDeleting(true);
    try {
      await window.electron.deleteServer(pId);
      setServers(servers.filter((servers) => servers.id !== pId));
    } catch (error) {
      console.error("Error deleting provider:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Servers</h1>
        <button
          onClick={() => setShowForm(true)}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          New Provider
        </button>
      </div>

      {showForm && (
        <ServerForm onSave={loadServers} onCancel={() => setShowForm(false)} />
      )}

      <div className="grid gap-4">
        {servers.map((s) => (
          <div key={s.name} className="bg-white p-4 rounded shadow mb-4">
            <div className="flex flex-row items-center justify-between">
              <h2 className="text-xl font-bold mb-2">{s.name}</h2>
              <Button
                variant="outline"
                size="icon"
                onClick={(e) => handleDelete(e, s.id)}
              >
                {isDeleting ? <Spinner /> : <Trash />}
              </Button>
            </div>

            <div className="space-y-2">
              <div>
                <span className="font-semibold">Command:</span>
                <code className="ml-2 bg-gray-100 p-1 rounded">
                  {s.command}
                </code>
              </div>
              <div>
                <span className="font-semibold">Arguments:</span>
                <ul className="ml-2 list-disc list-inside flex flex-col space-y-2">
                  {s.args.map((arg) => (
                    <li
                      key={arg}
                      className="bg-gray-100 p-1 rounded inline-block mr-2 mb-1"
                    >
                      {arg}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

interface ServerProps {
  onSave: () => void;
  onCancel: () => void;
}

interface FormData {
  name: string;
  command: string;
  args: string[];
}

function ServerForm(props: ServerProps) {
  const { onSave, onCancel } = props;

  const [formData, setFormData] = useState<FormData>({
    name: "",
    command: "",
    args: [],
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const config = {
      name: formData.name,
      command: formData.command,
      args: formData.args,
    };
    await window.electron.addServer(config);
    onSave();
    onCancel();
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-4 rounded shadow mb-4">
      <div className="grid gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Name</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full p-2 border rounded"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Command</label>
          <input
            type="text"
            value={formData.command}
            onChange={(e) =>
              setFormData({ ...formData, command: e.target.value })
            }
            className="w-full p-2 border rounded"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Arguments (comma-separated)
          </label>
          <input
            type="text"
            value={formData.args ? formData.args.join(",") : ""}
            onChange={(e) => {
              const newArgs =
                e.target.value === ""
                  ? []
                  : e.target.value.split(",").map((arg) => arg.trim());

              setFormData({
                ...formData,
                args: newArgs,
              });
            }}
            className="w-full p-2 border rounded"
            placeholder="Enter arguments separated by commas"
          />
        </div>

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-gray-600 hover:text-gray-800"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Save Server Config
          </button>
        </div>
      </div>
    </form>
  );
}
