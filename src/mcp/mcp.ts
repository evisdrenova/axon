import { ServerConfig } from "src/types";
import { Database } from "better-sqlite3";
import { Client } from "@modelcontextprotocol/sdk/client/index";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio";
import Anthropic from "@anthropic-ai/sdk";
import { MCPServerManager } from "./mcpManager";

type MCPClient = typeof Client;
type MCPTransport = typeof StdioClientTransport;

export default class MCP {
  private clients: Record<string, InstanceType<MCPClient>> = {};
  private client: MCPClient;
  private transport: MCPTransport;
  public serverManager: MCPServerManager;

  constructor(private readonly db: Database) {
    this.serverManager = new MCPServerManager(db);
  }

  public async init(): Promise<void> {
    this.client = await this.importClient();
    this.transport = await this.importTransport();
    await this.serverManager.initialize();
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
        "SELECT id, name, description, command, args, enabled FROM servers WHERE enabled = 1"
      );
      const rows = stmt.all() as {
        id: number;
        name: string;
        description: string;
        command: string;
        args: string;
        enabled: boolean;
      }[];

      return rows.map((row) => ({
        id: row.id,
        name: row.name,
        description: row.description,
        command: row.command,
        args: JSON.parse(row.args) as string[],
        enabled: row.enabled,
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

            // Get or start the server process
            let process = this.serverManager.getServerProcess(server.id!);
            if (!process) {
              process = await this.serverManager.startServer(server);
            }

            const clientName = `${server.name}`;
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
      await this.serverManager.cleanup();
    } catch (error) {
      console.error("Failed to close clients:", error);
      throw new Error("Unable to close clients");
    }
  }

  public async listTools(client?: string): Promise<Anthropic.Tool[]> {
    if (client) {
      if (!this.clients[client]) {
        throw new Error(`MCP Client ${client} not found`);
      }
      const { tools } = await this.clients[client].listTools();
      return tools.map((tool) => ({
        // the __ allows us to split the client out from the name later to use it
        name: `${client}__${tool.name}`,
        description: tool.description,
        input_schema: {
          type: tool.inputSchema.type,
          properties: tool.inputSchema.properties,
        },
      }));
    }
    const allTools = await Promise.all(
      Object.entries(this.clients).map(async ([clientName, client]) => {
        const { tools } = await client.listTools();
        return tools.map((tool) => ({
          // the __ allows us to split the client out from the name later to use it
          name: `${clientName}__${tool.name}`,
          description: tool.description,
          input_schema: {
            type: tool.inputSchema.type,
            properties: tool.inputSchema.properties,
          },
        }));
      })
    );

    return allTools.flat();
  }

  public async callTool({
    client,
    name,
    args,
  }: {
    client: string;
    name: string;
    args: any;
  }) {
    if (!this.clients[client]) {
      throw new Error(`MCP Client ${client} not found`);
    }
    const result = await this.clients[client].callTool({
      name,
      arguments: args,
    });
    return result;
  }
}
