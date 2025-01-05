import { Database } from "better-sqlite3";
import { ServerConfig } from "../../src/types";
import { Client } from "@modelcontextprotocol/sdk/client/index";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio";

export function getServers(db: Database): ServerConfig[] {
  try {
    const stmt = db.prepare("SELECT id, name, command, args FROM servers");
    const rows = stmt.all() as {
      id: number;
      name: string;
      command: string;
      args: string;
    }[];

    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      command: row.command,
      args: JSON.parse(row.args) as string[],
    }));
  } catch (error) {
    console.log("database error", error);
    throw error;
  }
}

export async function initializeServers(db: Database) {
  try {
    const servers = getServers(db);

    // Start each server
    for (const server of servers) {
      console.log(`Initializing server: ${server.name}`);

      await createClient(server);
    }
  } catch (error) {
    console.error("Failed to initialize server(s):", error);
  }
}

async function createClient(server: ServerConfig) {
  const transport = new StdioClientTransport({
    command: server.command,
    args: server.args,
  });

  const client = new Client(
    {
      name: `${server.name}-client`,
      version: "0.0.1",
    },
    {
      capabilities: {},
    }
  );

  try {
    await client.connect(transport);
    return client;
  } catch (error) {
    console.log("error", error);
    throw error;
  }
}
