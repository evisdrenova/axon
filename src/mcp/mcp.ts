import { ServerConfig } from "src/types";
import { Database } from "better-sqlite3";
import { Client } from "@modelcontextprotocol/sdk/client/index";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio";

type MCPClient = typeof Client;
type MCPTransport = typeof StdioClientTransport;

export default class MCP {
  private clients: Record<string, InstanceType<MCPClient>> = {};
  private client: MCPClient;
  private transport: MCPTransport;

  constructor(private readonly db: Database) {}

  public async init(): Promise<void> {
    this.client = await this.importClient();
    this.transport = await this.importTransport();
  }

  private async importClient(): Promise<MCPClient> {
    const { Client } = await import("@modelcontextprotocol/sdk/client/index");
    return Client;
  }

  private async importTransport(): Promise<MCPTransport> {
    const { StdioClientTransport } = await import(
      "@modelcontextprotocol/sdk/client/stdio"
    );
    return StdioClientTransport;
  }

  public getServers(): ServerConfig[] {
    try {
      const stmt = this.db.prepare(
        "SELECT id, name, command, args FROM servers"
      );
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

  public async createClients(): Promise<void> {
    try {
      if (!this.client || !this.transport) {
        await this.init();
      }
      const servers = this.getServers();
      if (servers.length > 0) {
        await Promise.all(
          servers.map(async (server) => {
            console.log(`Initializing server: ${server.name}`);

            const clientName = `${server.name}-client`;
            const client = new this.client(
              { name: clientName, version: "0.0.1" },
              { capabilities: {} }
            );

            await client.connect(
              new this.transport({
                command: server.command,
                args: server.args,
              })
            );

            this.clients[clientName] = client;
          })
        );
      }
    } catch (error) {
      console.error("Failed to initialize servers:", error);
      throw new Error("Unable to initialize servers");
    }
  }

  public async closeClients(): Promise<void> {
    try {
      await Promise.all(
        Object.values(this.clients).map((client) => client.close())
      );
      this.clients = {};
    } catch (error) {
      console.error("Failed to close clients:", error);
      throw new Error("Unable to close clients");
    }
  }
}
