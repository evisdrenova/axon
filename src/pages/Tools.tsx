import { useState, useEffect } from "react";
import { ServerConfig } from "../types";
import { Button } from "../../components/ui/button";
import { Card, CardContent } from "../../components/ui/card";
import ServerTable from "../../components/Tables/ServerTable";
import { Wrench } from "lucide-react";
import ButtonText from "../../src/lib/ButtonText";
import Spinner from "../../src/lib/Spinner";

export type InstallStatus = {
  stage: "saving" | "installing" | "starting" | "complete" | "error";
  message: string;
};

export default function Tools() {
  const [servers, setservers] = useState<ServerConfig[] | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [editingServer, setEditingServer] = useState<ServerConfig | null>(null);

  const loadServers = async () => {
    const servers = await window.electron.getServers();
    setservers(servers);
  };

  useEffect(() => {
    loadServers();
  }, []);

  if (servers === null) {
    return <div className="p-4">Loading...</div>;
  }

  if (servers.length === 0 && !showForm) {
    return (
      <div className="p-4 border-2 border-main-200 m-4 rounded-lg border-dashed">
        <div className="flex flex-col gap-2 items-center py-8">
          <Wrench size={20} className="text-primary" />
          <p className="text-foreground mb-4">No servers added yet</p>
          <Button onClick={() => setShowForm(true)}>+ Add New Server</Button>
        </div>
      </div>
    );
  }

  const handleDelete = async (pId: number) => {
    setIsDeleting(true);
    try {
      await window.electron.deleteServer(pId);
      setservers(servers!.filter((server) => server.id !== pId));
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

  const handleEnableDisableSwitch = async (
    serverId: number,
    checked: boolean
  ) => {
    try {
      if (checked) {
        await window.electron.startServer(serverId);
      } else {
        await window.electron.stopServer(serverId);
      }
      setservers(
        servers!.map((server) =>
          server.id === serverId ? { ...server, enabled: checked } : server
        )
      );
    } catch (error) {
      await loadServers();
    }
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
            + New Server
          </Button>
        )}
      </div>

      {showForm ? (
        <ServerForm
          onSave={loadServers}
          onCancel={handleCloseForm}
          initialData={editingServer}
          isDeleting={isDeleting}
          handleDelete={handleDelete}
        />
      ) : (
        <ServerTable
          servers={servers}
          handleEdit={handleEdit}
          handleEnableDisableSwitch={handleEnableDisableSwitch}
        />
      )}
    </div>
  );
}

interface ServerProps {
  onSave: () => void;
  onCancel: () => void;
  initialData?: ServerConfig | null;
  isDeleting: boolean;
  handleDelete: (val: number) => void;
}

function ServerForm(props: ServerProps) {
  const { onSave, onCancel, initialData, isDeleting, handleDelete } = props;
  const [status, setStatus] = useState<InstallStatus | null>();

  const [formData, setFormData] = useState<ServerConfig>(() => {
    if (initialData) {
      return {
        id: initialData.id,
        name: initialData.name,
        description: initialData.description,
        installType: initialData.installType,
        package: initialData.package,
        startCommand: initialData.startCommand,
        args: initialData.args,
        version: initialData.version,
        enabled: initialData.enabled,
      };
    }
    return {
      name: "",
      description: "",
      installType: "npm",
      package: "",
      startCommand: "",
      args: [],
      version: "latest",
      enabled: true,
    };
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setStatus({ stage: "saving", message: "Saving server configuration..." });

      const config: ServerConfig = {
        id: formData.id,
        name: formData.name,
        description: formData.description,
        installType: formData.installType,
        package: formData.package,
        startCommand: formData.startCommand || null,
        args: formData.args,
        version: formData.version || "latest",
        enabled: formData.enabled,
      };

      if (initialData) {
        // Save to database
        await window.electron.updateServer(config);

        if (config.enabled) {
          //TODO: determine when we need to uninstall and re-install instead of just restarting
          // setStatus({ stage: "installing", message: "Installing server..." });
          // await window.electron.installServer(config.id);
          // Restart the server
          await window.electron.stopServer(config.id!);
          // Start the server
          setStatus({ stage: "starting", message: "Starting server..." });
          await window.electron.startServer(config.id!);
        }
      } else {
        // Save to database
        const serverId = await window.electron.addServer(config);

        // Install the server
        setStatus({ stage: "installing", message: "Installing server..." });
        // await window.electron.installServer(serverId);

        // Start the server
        setStatus({ stage: "starting", message: "Starting server..." });
        await window.electron.startServer(serverId);
      }

      setStatus({ stage: "complete", message: "Server is ready!" });

      // Wait a moment to show success state
      setTimeout(() => {
        onSave();
        onCancel();
      }, 1000);
    } catch (error) {
      setStatus({
        stage: "error",
        message: `Error: ${error.message}`,
      });
    }
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          {status && (
            <div
              className={`p-4 rounded ${
                status.stage === "error"
                  ? "bg-red-100"
                  : status.stage === "complete"
                  ? "bg-green-100"
                  : "bg-blue-100"
              }`}
            >
              <div className="flex items-center gap-2">
                {status.stage !== "complete" && status.stage !== "error" && (
                  <div className="animate-spin">⚙️</div>
                )}
                {status.stage === "complete" && "✅"}
                {status.stage === "error" && "❌"}
                <span>{status.message}</span>
              </div>
            </div>
          )}

          <div className="flex justify-end ">
            {initialData && ( // Only show delete button when editing
              <Button
                type="button"
                variant="destructive"
                onClick={(e) => {
                  e.preventDefault();
                  if (initialData.id) {
                    handleDelete(initialData.id);
                    onCancel(); // Close the form after deletion
                  }
                }}
              >
                <ButtonText
                  leftIcon={
                    isDeleting ? (
                      <Spinner className="text-black dark:text-white" />
                    ) : (
                      <div />
                    )
                  }
                  text="Delete Server"
                />
              </Button>
            )}
          </div>
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
                setFormData({ ...formData, description: e.target.value })
              }
              className="w-full p-2 border rounded"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              Install Type
            </label>
            <select
              value={formData.installType}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  installType: e.target.value as
                    | "npm"
                    | "pip"
                    | "binary"
                    | "uv",
                })
              }
              className="w-full p-2 border rounded"
              required
            >
              <option value="npm">NPM</option>
              <option value="pip">PIP</option>
              <option value="uv">UV</option>
              <option value="binary">Binary</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              Package Name
            </label>
            <input
              type="text"
              value={formData.package}
              onChange={(e) =>
                setFormData({ ...formData, package: e.target.value })
              }
              className="w-full p-2 border rounded"
              required
              placeholder="e.g., @modelcontextprotocol/server-filesystem"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              Start Command (optional)
            </label>
            <input
              type="text"
              value={formData.startCommand}
              onChange={(e) =>
                setFormData({ ...formData, startCommand: e.target.value })
              }
              className="w-full p-2 border rounded"
              placeholder="Leave empty to use package name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Version</label>
            <input
              type="text"
              value={formData.version}
              onChange={(e) =>
                setFormData({ ...formData, version: e.target.value })
              }
              className="w-full p-2 border rounded"
              placeholder="latest"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              Arguments (comma-separated)
            </label>
            <input
              type="text"
              value={formData.args.join(",")}
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

          <div className="flex justify-between w-full gap-2">
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={status && status.stage !== "error"}
              >
                Cancel
              </Button>
            </div>
            <Button type="submit" disabled={status && status.stage !== "error"}>
              {initialData ? "Update Server" : "Save Server Config"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
