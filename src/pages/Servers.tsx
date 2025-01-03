import { useState, useEffect } from "react";
import { McpConfig } from "../types";

export default function Servers() {
  const [servers, setServers] = useState<McpConfig[] | null>(null);
  const [showForm, setShowForm] = useState(false);

  const loadServers = async () => {
    const servers = await window.electron.getMcpServers();
    setServers(servers);
  };

  useEffect(() => {
    loadServers();
  }, []);

  if (servers.length === 0 && !showForm) {
    return (
      <div className="p-4">
        <div className="text-center py-8">
          <p className="text-gray-600 mb-4">No providers created yet</p>
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
        {Object.entries(servers).map(([name, server]) => (
          <div key={name} className="bg-white p-4 rounded shadow mb-4">
            <h2 className="text-xl font-bold mb-2">{name}</h2>
            <div className="space-y-2">
              <div>
                <span className="font-semibold">Command:</span>
                <code className="ml-2 bg-gray-100 p-1 rounded">
                  {server.command.command}
                </code>
              </div>
              <div>
                <span className="font-semibold">Arguments:</span>
                <ul className="ml-2 list-disc list-inside">
                  {server.args.args.map((arg, index) => (
                    <li
                      key={index}
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
    const config: McpConfig = {
      [formData.name]: {
        command: formData.command,
        args: formData.args,
      },
    };
    await window.electron.addMcpServer(config);
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
            onChange={(e) =>
              setFormData({
                ...formData,
                args: e.target.value
                  .split(",")
                  .map((arg) => arg.trim())
                  .filter((arg) => arg !== ""),
              })
            }
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
