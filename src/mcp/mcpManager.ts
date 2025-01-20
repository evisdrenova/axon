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
  private activeProcesses: Map<number, ChildProcess> = new Map();

  constructor(private readonly db: Database) {
    this.serversPath = path.join(app.getPath("userData"), "mcp-servers");
  }

  async initialize() {
    await this.ensureDirectories();
    // load in configs from db
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

  // builds the right installation command based on the installation type and OS
  async installServer(
    config: ServerConfig,
    db: Database
  ): Promise<ServerConfig> {
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
          config.startCommand = await this.getNpmBinaryName(
            serverPath,
            config.package
          );
          return config;

        case "pip":
        case "uv":
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
          return config;

        case "binary":
          //TODO
          return config;

        default:
          throw new Error(`Unknown install type: ${config.installType}`);
      }
    } catch (error) {
      log.error(`Failed to install server ${config.name}:`, error);
      // Clean up directory if installation fails
      try {
        await fs.rm(serverPath, { recursive: true, force: true });
      } catch (cleanupError) {
        log.error(
          "Failed to clean up after failed installation:",
          cleanupError
        );
      }
      throw error;
    }
  }

  // gets the binary name from the package.json file in the node_module in order to construct the start command
  private async getNpmBinaryName(
    serverPath: string,
    packageName: string
  ): Promise<string> {
    try {
      const packageJsonPath = path.join(
        serverPath,
        "node_modules",
        packageName,
        "package.json"
      );

      const packageJson = JSON.parse(
        await fs.readFile(packageJsonPath, "utf-8")
      );

      if (!packageJson.bin) {
        throw new Error(
          `Package ${packageName} does not have a bin field in package.json`
        );
      }

      // Get binary name from the bin field
      let binaryName: string;
      if (typeof packageJson.bin === "string") {
        // If bin is a string, use the package name
        binaryName = packageName.split("/").pop()!;
      } else {
        // If bin is an object, get the first key
        binaryName = Object.keys(packageJson.bin)[0];
      }

      log.info(`Found binary name from package.json: ${binaryName}`);
      return binaryName;
    } catch (error) {
      log.error(`Failed to get binary name for ${packageName}:`, error);
      throw error;
    }
  }
  // builds the right start command based on the install type and the OS
  // and starts a new process for each server
  async startServer(config: ServerConfig): Promise<ChildProcess> {
    const serverPath = path.join(this.serversPath, config.name);
    let serverProcess: ChildProcess;

    console.log("server path", serverPath);
    console.log("config", config);

    try {
      switch (config.installType) {
        case "npm":
          // builds the path to the bin in the node_modules
          const npmBinPath = path.join(serverPath, "node_modules", ".bin");

          console.log("npmBinPath");

          // determines binary name
          const binaryName =
            config.startCommand ||
            (config.package.includes("server-")
              ? "mcp-" +
                config.package
                  .split("/")
                  .pop()!
                  .replace("@modelcontextprotocol/", "")
              : config.package
                  .split("/")
                  .pop()!
                  .replace("@modelcontextprotocol/", ""));

          const commandPath = path.join(npmBinPath, binaryName);

          const args =
            typeof config.args === "string"
              ? JSON.parse(config.args)
              : config.args;

          log.info("Starting server with:", {
            npmBinPath,
            binaryName,
            commandPath,
            args: args,
            cwd: serverPath,
          });

          // Check if binary exists
          try {
            await fs.access(commandPath);
          } catch (error) {
            log.error(`Binary not found at ${commandPath}`);
            throw new Error(`Binary not found: ${binaryName}`);
          }

          serverProcess = spawn(commandPath, args, {
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

  // starts servers that are marked as enabled in the database
  // by default any newly added server is enabled
  async startEnabledServers() {
    const stmt = this.db.prepare("SELECT * FROM servers WHERE enabled = 1");
    const servers = stmt.all() as ServerConfig[];

    for (const server of servers) {
      try {
        await this.startServer(server);
      } catch (error) {
        log.error(`Failed to start enabled server ${server.name}:`, error);
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

  // used when we delete a server
  async cleanupServer(id: number, name: string) {
    await this.stopServer(id);
    const serverPath = path.join(this.serversPath, name);
    await fs.rm(serverPath, { recursive: true, force: true });
  }

  getServerProcess(id: number): ChildProcess | undefined {
    return this.activeProcesses.get(id);
  }
}
