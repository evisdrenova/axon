import { ServerConfig } from "src/types";
import { Database } from "better-sqlite3";
import { Client } from "@modelcontextprotocol/sdk/client/index";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio";
import Anthropic from "@anthropic-ai/sdk";
import { MCPServerManager } from "./mcpManager";
import path from "path";
import { app } from "electron";
import log from "electron-log/main";
import fs from "fs/promises";

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
          command: this.getServerBinaryPath(server),
          // command:
          //   "/Users/evisdrenova/Library/Application Support/axon/mcp-servers/filesystem/node_modules/.bin/mcp-server-filesystem",
          args: server.args,
        })
      );

      this.clients[clientName] = client;
    } catch (error) {
      console.error("Failed to create client:", error);
      throw new Error("Failed to create client");
    }
  }

  //TODO: verify the path construction is working correctly

  // returns the path to the server binary for execution
  private getServerBinaryPath(server: ServerConfig): string {
    let serverPath: string;
    const dirPath = path.join(
      app.getPath("userData"),
      "mcp-servers",
      server.name
    );

    switch (server.installType) {
      case "npm":
        // builds the path to the bin in the node_modules
        const npmBinPath = path.join(serverPath, "node_modules", ".bin");

        console.log("npmBinPath", npmBinPath);

        // determines binary name
        const binaryName =
          server.startCommand ||
          (server.package.includes("server-")
            ? "mcp-" +
              server.package
                .split("/")
                .pop()!
                .replace("@modelcontextprotocol/", "")
            : server.package
                .split("/")
                .pop()!
                .replace("@modelcontextprotocol/", ""));

        const commandPath = path.join(npmBinPath, binaryName);

        if (this.doesBinaryExist(commandPath, binaryName)) {
          serverPath = path.join(serverPath, "node_modules");
        }
        break;
      // case "pip":
      // case "uv":
      //   const pythonPath =
      //     process.platform === "win32"
      //       ? path.join(serverPath, "venv", "Scripts", "python")
      //       : path.join(serverPath, "venv", "bin", "python");

      //   serverProcess = spawn(
      //     pythonPath,
      //     ["-m", server.startCommand || server.package, ...server.args],
      //     {
      //       cwd: serverPath,
      //     }
      //   );
      //   break;

      // case "binary":
      //   serverProcess = spawn(
      //     config.startCommand || config.package,
      //     config.args,
      //     {
      //       cwd: serverPath,
      //     }
      //   );
      //   break;
    }

    return serverPath;
  }

  private async doesBinaryExist(path: string, name: string): Promise<boolean> {
    try {
      // Check if path exists
      await fs.access(path, fs.constants.F_OK);

      // Check if file is executable
      await fs.access(path, fs.constants.X_OK);

      // Get file stats
      const stats = await fs.stat(path);

      // Verify it's a file and not a directory
      if (!stats.isFile()) {
        throw new Error(`${name} exists but is not a file`);
      }

      log.info(`Binary verified: ${name} at ${path}`);
      return true;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") {
        log.error(`Binary not found: ${name} at ${path}`);
        throw new Error(`Binary not found: ${name}`);
      }

      if ((error as NodeJS.ErrnoException).code === "EACCES") {
        log.error(`Binary exists but is not executable: ${name} at ${path}`);
        throw new Error(`Binary exists but is not executable: ${name}`);
      }

      log.error(`Error verifying binary: ${name}`, error);
      throw error;
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
    if (!this.clients[clientName]) {
      console.error("Unable to find running server:", clientName);
      throw new Error(`Unable to find running server ${clientName}`);
    }
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
