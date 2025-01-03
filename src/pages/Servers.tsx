import { useState, useEffect } from "react";
import type { McpConfig } from "../types/electron";

export default function Servers() {
  const [config, setConfig] = useState<McpConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadServers = async () => {
      try {
        const config = await window.electron.loadConfig();
        setConfig(config);
      } catch (err) {
        setError("Failed to load servers");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadServers();
  }, []);

  if (loading) return <div>Loading...</div>;
  if (error) return <div className="text-red-500">{error}</div>;

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Servers</h1>
      <h2 className="font-bold">Model: {config.model.name}</h2>
      <div className="grid gap-4">
        {Object.entries(config.mcp_servers).map(([name, serverConfig]) => (
          <div key={name} className="bg-white p-4 rounded shadow">
            <h2 className="font-bold">{name}</h2>
            <p>{serverConfig.command}</p>
            <p>{serverConfig.args}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
