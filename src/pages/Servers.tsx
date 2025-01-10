import { useState, useEffect } from "react";
import { ServerConfig } from "../types";
import { Button } from "../../components/ui/button";
import { Card, CardContent } from "../../components/ui/card";
import ServerTable from "../../components/ServerTable/ServerTable";

export default function Servers() {
  const [servers, setServers] = useState<ServerConfig[] | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [editingServer, setEditingServer] = useState<ServerConfig | null>(null);

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
        <Card className="text-center py-8">
          <CardContent>
            <p className="text-muted-foreground mb-4">No servers created yet</p>
            <Button onClick={() => setShowForm(true)}>Create New Server</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleDelete = async (e: React.MouseEvent, pId: number) => {
    e.preventDefault();
    setIsDeleting(true);
    try {
      await window.electron.deleteServer(pId);
      setServers(servers.filter((server) => server.id !== pId));
    } catch (error) {
      console.error("Error deleting server:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleEdit = (server: ServerConfig) => {
    setEditingServer(server);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingServer(null);
  };

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Servers</h1>
        {!showForm && (
          <Button
            onClick={() => {
              setEditingServer(null);
              setShowForm(true);
            }}
          >
            New Server
          </Button>
        )}
      </div>

      {showForm ? (
        <ServerForm
          onSave={loadServers}
          onCancel={handleCloseForm}
          initialData={editingServer}
        />
      ) : (
        <ServerTable servers={servers} handleEdit={handleEdit} />
      )}
    </div>
  );
}

interface ServerProps {
  onSave: () => void;
  onCancel: () => void;
  initialData?: ServerConfig | null;
}

interface FormData {
  name: string;
  description?: string;
  command: string;
  args: string[];
  id?: number;
}

function ServerForm(props: ServerProps) {
  const { onSave, onCancel, initialData } = props;

  const [formData, setFormData] = useState<FormData>(() => {
    if (initialData) {
      return {
        id: initialData.id,
        name: initialData.name,
        description: initialData.description,
        command: initialData.command,
        args: initialData.args,
      };
    }
    return {
      name: "",
      description: "",
      command: "",
      args: [],
    };
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const config = {
      id: formData.id,
      name: formData.name,
      description: formData.description ?? "",
      command: formData.command,
      args: formData.args,
    };

    if (initialData) {
      await window.electron.updateServer(config);
    } else {
      await window.electron.addServer(config);
    }
    onSave();
    onCancel();
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className="w-full p-2 border rounded"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              Description
            </label>
            <input
              type="text"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
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
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit">
              {initialData ? "Update Server" : "Save Server Config"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
