import { app } from "electron";
import path from "path";
import fs from "fs/promises";
import { exec, spawn, ChildProcess } from "child_process";
import { promisify } from "util";
import log from "electron-log/main";
import { Database } from "better-sqlite3";
import { ServerConfig } from "../../src/types";

/*
McpManager manages the install, initialization, management and enablement/disablement of mcp servers
*/

export interface ServerMetadataObject {
  [key: string]: ServerMetadata;
}

export interface ServerMetadata {
  installType: "npm" | "npx" | "pip" | "binary" | "uv";
  package: string;
  version?: string;
}

const execAsync = promisify(exec);

export class MCPServerManager {
  private serversPath: string;
  private metadataPath: string;
  private activeProcesses: Map<number, ChildProcess> = new Map();
  private serverMetadata: Map<string, ServerMetadata> = new Map();

  constructor(private readonly db: Database) {
    this.serversPath = path.join(app.getPath("userData"), "mcp-servers");
    this.metadataPath = path.join(this.serversPath, "metadata.json");
  }

  async initialize() {
    await this.ensureDirectories();
    await this.loadMetadata();
    await this.startEnabledServers();
  }

  // checks if the mcp directory exists if not, creates it
  private async ensureDirectories() {
    try {
      await fs.mkdir(this.serversPath, { recursive: true });
    } catch (error) {
      log.error("Failed to create MCP servers directory:", error);
      throw error;
    }
  }

  // loads the mcp metadata
  private async loadMetadata() {
    try {
      const exists = await fs
        .access(this.metadataPath)
        .then(() => true)
        .catch(() => false);

      if (exists) {
        const data = await fs.readFile(this.metadataPath, "utf-8");
        const metadata: ServerMetadataObject = JSON.parse(data);
        this.serverMetadata = new Map(Object.entries(metadata));
      }
    } catch (error) {
      log.error("Failed to load server metadata:", error);
      throw error;
    }
  }

  // saves the mcp server metadata
  private async saveMetadata() {
    try {
      const metadata = Object.fromEntries(this.serverMetadata);
      await fs.writeFile(this.metadataPath, JSON.stringify(metadata, null, 2));
    } catch (error) {
      log.error("Failed to save server metadata:", error);
      throw error;
    }
  }

  // builds the right installation command based on the installation type and OS
  async installServer(config: ServerConfig): Promise<boolean> {
    const serverPath = path.join(this.serversPath, config.name);

    try {
      await fs.mkdir(serverPath, { recursive: true });

      switch (config.installType) {
        case "npm":
          await execAsync(
            `npm install ${config.package}${
              config.version ? `@${config.version}` : ""
            }`,
            {
              cwd: serverPath,
            }
          );
          break;

        case "pip":
        case "uv":
          // Create virtual environment
          await execAsync("python3 -m venv venv", {
            cwd: serverPath,
          });

          if (config.installType === "uv") {
            try {
              await execAsync("pip install uv");
            } catch (error) {
              log.error("Failed to install uv:", error);
              throw error;
            }

            await execAsync(
              `uv pip install ${config.package}${
                config.version ? `==${config.version}` : ""
              }`,
              { cwd: serverPath }
            );
          } else {
            const pipCommand =
              process.platform === "win32"
                ? path.join(serverPath, "venv", "Scripts", "pip")
                : path.join(serverPath, "venv", "bin", "pip");

            await execAsync(
              `"${pipCommand}" install ${config.package}${
                config.version ? `==${config.version}` : ""
              }`,
              { cwd: serverPath }
            );
          }
          break;

        case "binary":
          // Implement binary installation logic based on your needs
          break;
      }

      return true;
    } catch (error) {
      log.error(`Failed to install server ${config.name}:`, error);
      throw error;
    }
  }

  // builds the right start command based on the install type and the OS
  // and starts a new process for each server
  async startServer(config: ServerConfig): Promise<ChildProcess> {
    const serverPath = path.join(this.serversPath, config.name);
    let serverProcess: ChildProcess;

    try {
      switch (config.installType) {
        case "npm":
          const npmBinPath = path.join(serverPath, "node_modules", ".bin");
          const commandPath = path.join(
            npmBinPath,
            config.startCommand || config.package.split("/").pop()!
          );

          serverProcess = spawn(commandPath, config.args, {
            cwd: serverPath,
            env: {
              ...process.env,
              NODE_PATH: path.join(serverPath, "node_modules"),
            },
            shell: true,
          });
          break;

        case "pip":
        case "uv":
          const pythonPath =
            process.platform === "win32"
              ? path.join(serverPath, "venv", "Scripts", "python")
              : path.join(serverPath, "venv", "bin", "python");

          serverProcess = spawn(
            pythonPath,
            ["-m", config.startCommand || config.package, ...config.args],
            {
              cwd: serverPath,
            }
          );
          break;

        case "binary":
          serverProcess = spawn(
            config.startCommand || config.package,
            config.args,
            {
              cwd: serverPath,
            }
          );
          break;
      }

      serverProcess.stdout?.on("data", (data) => {
        log.info(`[${config.name}] ${data}`);
      });

      serverProcess.stderr?.on("data", (data) => {
        log.error(`[${config.name}] ${data}`);
      });

      serverProcess.on("error", (error) => {
        log.error(`Server ${config.name} process error:`, error);
      });

      serverProcess.on("close", (code) => {
        log.info(`Server ${config.name} exited with code ${code}`);
        this.activeProcesses.delete(config.id!);
      });

      this.activeProcesses.set(config.id!, serverProcess);
      return serverProcess;
    } catch (error) {
      log.error(`Failed to start server ${config.name}:`, error);
      throw error;
    }
  }

  async startEnabledServers() {
    const stmt = this.db.prepare("SELECT * FROM servers WHERE enabled = 1");
    const servers = stmt.all() as ServerConfig[];

    for (const server of servers) {
      try {
        await this.startServer(server);
      } catch (error) {
        log.error(`Failed to start server ${server.name}:`, error);
      }
    }
  }

  async enableServer(id: number) {
    const stmt = this.db.prepare("UPDATE servers SET enabled = 1 WHERE id = ?");
    stmt.run(id);

    const serverStmt = this.db.prepare("SELECT * FROM servers WHERE id = ?");
    const server = serverStmt.get(id) as ServerConfig;

    if (server) {
      return this.startServer(server);
    }
  }

  async disableServer(id: number) {
    const stmt = this.db.prepare("UPDATE servers SET enabled = 0 WHERE id = ?");
    stmt.run(id);
    return this.stopServer(id);
  }

  async stopServer(id: number) {
    const process = this.activeProcesses.get(id);
    if (process) {
      process.kill();
      this.activeProcesses.delete(id);
    }
  }

  async cleanup() {
    for (const [id, process] of this.activeProcesses) {
      await this.stopServer(id);
    }
  }

  getServerProcess(id: number): ChildProcess | undefined {
    return this.activeProcesses.get(id);
  }
}
