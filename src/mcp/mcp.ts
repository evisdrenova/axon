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
        `SELECT 
         id, 
         name, 
         description, 
         installType, 
         package, 
         startCommand, 
         args, 
         version, 
         enabled FROM servers`
      );
      const rows = stmt.all() as {
        id: number;
        name: string;
        description: string;
        installType: string;
        package: string;
        startCommand: string;
        args: string;
        version: string;
        enabled: boolean;
      }[];

      return rows.map((row) => ({
        id: row.id,
        name: row.name,
        description: row.description,
        installType: row.installType,
        package: row.package,
        startCommand: row.startCommand,
        args: JSON.parse(row.args) as string[],
        version: row.version,
        enabled: row.enabled,
      }));
    } catch (error) {
      console.log("database error", error);
      throw error;
    }
  }

  // TODO: update the start server logic
  // right now the createClients method calls the startServer, but it doesn't need to rely on that to start the server
  // we just need an install server method (which is kinda okay)
  // and then the startServer method can be a combo of the createClients and start server method
  // which creates a client for each enabled server and then connects to it
  // then if someone wants to disable a server, we just remove the remove the active client, cleanup the server
  // same on the reverse, if someone wants to start/enable a server, we check to see if we have a client, if not, then we create the client and start the server using the same method
  // so there is an initial initiailziation step of all enabled servers in the db
  // then ongoing enable/disable depending on what the user wants to do

  // create clients for the enabled servers
  public async createClients(): Promise<void> {
    try {
      if (!this.client || !this.transport) {
        await this.init();
      }
      const servers = this.getServers();

      if (servers.length > 0) {
        await Promise.all(
          servers.map(async (server) => {
            if (server.enabled) {
              await this.createClient(server);
            }
          })
        );
      }
    } catch (error) {
      console.error("Failed to initialize servers:", error);
      throw new Error("Unable to initialize servers");
    }
  }

  public async createClient(server: ServerConfig): Promise<void> {
    try {
      console.log(`Initializing server`, server);

      const clientName = `${server.name}`;

      //client already exists for this server
      if (this.clients[clientName]) {
        return;
      }
      const client = new this.client(
        { name: clientName, version: "0.0.1" },
        { capabilities: {} }
      );

      await client.connect(
        new this.transport({
          //  command: server.startCommand, // this  needs to be the server path
          command:
            "/Users/evisdrenova/Library/Application Support/axon/mcp-servers/filesystem/node_modules/.bin/mcp-server-filesystem",
          args: server.args,
        })
      );

      this.clients[clientName] = client;
    } catch (error) {
      console.error("Failed to create client:", error);
      throw new Error("Failed to create client");
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

  public async closeClient(server: ServerConfig): Promise<void> {
    console.log("Closing server:", server);
    const clientName = this.getClientNameFromServer(server);
    try {
      await this.clients[clientName].close();
    } catch (error) {
      console.error("Failed to close client:", clientName);
      throw new Error(`Unable to close client ${clientName}`);
    }
  }

  private getClientNameFromServer(server: ServerConfig): string {
    return `${server.name}`;
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
