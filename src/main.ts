import { app, BrowserWindow, ipcMain, Menu, MenuItem } from "electron";
import path from "path";
import started from "electron-squirrel-startup";
import Database from "better-sqlite3";
import { ServerConfig, Provider, Message, User, Conversation } from "./types";
import log from "electron-log/main";
import MCP from "./mcp/mcp";
import Providers from "./providers/providers";
import SettingsManager, { SettingsValue } from "./settings/Settings";
import { StreamChat } from "stream-chat";

import * as dotenv from "dotenv";
dotenv.config();

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (started) {
  app.quit();
}

let db = new Database();
let mcp: MCP;
let providers: Providers;
log.initialize();
let mainWindow: BrowserWindow | null = null;
let settingManager: SettingsManager;

const initializeDatabase = () => {
  const dbPath = path.join(app.getPath("userData"), "database.sqlite");
  db = new Database(dbPath);

  // Create tables if they don't exist
  db.exec(`
    CREATE TABLE IF NOT EXISTS settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      key TEXT UNIQUE,
      value TEXT
    );
  `);
  db.exec(`
   CREATE TABLE IF NOT EXISTS providers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      type TEXT NOT NULL,    -- "openai" | "anthropic" | "ollama" | "custom"
      baseUrl TEXT NOT NULL,         -- e.g. "https://api.openai.com/v1"
      apiPath TEXT NOT NULL,         -- e.g. "/chat/completions", or a custom path for local
      apiKey TEXT NOT NULL,
      model TEXT,                -- e.g. "gpt-4", "claude-instant-v1", "llama2-7b"
      config TEXT,                   -- optional JSON for special fields
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
);
    `);
  db.exec(`
      CREATE TABLE IF NOT EXISTS servers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT,
        installType TEXT NOT NULL,
        package TEXT NOT NULL,
        startCommand TEXT,
        args TEXT NOT NULL,
        version TEXT,
        enabled BOOLEAN DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);
  db.exec(`
    CREATE TABLE IF NOT EXISTS conversations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      providerId INTEGER,
      title TEXT,
      parent_conversation_id INTEGER,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (providerId) REFERENCES providers(id) ON DELETE CASCADE
      FOREIGN KEY (parent_conversation_id) REFERENCES conversations(id) ON DELETE CASCADE
);`);

  db.exec(`
  CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    conversationId INTEGER,
    role TEXT,       -- "user" | "assistant" | "system"
    content TEXT,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (conversationId) REFERENCES conversations(id) ON DELETE CASCADE
);`);

  db.exec(`
    CREATE TABLE IF NOT EXISTS user (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT
   )
  `);

  return db;
};

const createWindow = async () => {
  initializeDatabase();

  mcp = new MCP(db);
  await mcp.init();
  providers = new Providers(mcp);
  await mcp.createClients();
  settingManager = new SettingsManager(db);
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 900,
    frame: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, "preload.js"),
    },
  });

  // and load the index.html of the app.
  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(
      path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`)
    );
  }

  // Open the DevTools.
  mainWindow.webContents.openDevTools();
  mainWindow.webContents.on("context-menu", (event, params) => {
    const menu = new Menu();
    menu.append(
      new MenuItem({
        label: "Inspect Element",
        click: () => {
          mainWindow.webContents.inspectElement(params.x, params.y);
        },
      })
    );
    menu.popup();
  });
};

ipcMain.on("window-minimize", () => {
  mainWindow.minimize();
});

ipcMain.on("window-maximize", () => {
  if (mainWindow.isMaximized()) {
    mainWindow.unmaximize();
  } else {
    mainWindow.maximize();
  }
});

ipcMain.on("window-close", () => {
  mainWindow.close();
});

ipcMain.handle("db-get-setting", async (_event, key: string) => {
  return settingManager.get(key);
});

ipcMain.handle(
  "db-set-setting",
  async (_event, key: string, value: SettingsValue) => {
    return settingManager.set(key, value);
  }
);

ipcMain.handle("db-get-all-settings", async () => {
  return settingManager.getAll();
});

ipcMain.handle(
  "db-set-multiple-settings",
  async (_event, settings: Record<string, SettingsValue>) => {
    return settingManager.setMultiple(settings);
  }
);

ipcMain.handle("set-user", (_, user: User) => {
  const stmt = db.prepare(`
    INSERT into user (name) values (?)`);

  return stmt.run(user.name);
});

ipcMain.handle("get-user", () => {
  try {
    const stmt = db.prepare(`SELECT id, name from user`);
    const user = stmt.get();
    return user;
  } catch (error) {
    throw error;
  }
});

ipcMain.handle("get-providers", () => {
  try {
    const stmt = db.prepare(
      "SELECT id, name, type, baseUrl, apiPath, apiKey, model, config FROM providers"
    );
    return stmt.all();
  } catch (error) {
    throw error;
  }
});

ipcMain.handle("add-provider", (_, provider: Provider) => {
  try {
    const stmt = db.prepare(
      "INSERT INTO providers (name, type, baseUrl, apiPath, apiKey, model, config) VALUES (?, ?, ?, ?, ?, ?, ?)"
    );
    return stmt.run(
      provider.name,
      provider.type,
      provider.baseUrl,
      provider.apiPath,
      provider.apiKey,
      provider.model,
      provider.config
    );
  } catch (error) {
    console.log("unable to create new provider", error);
    throw new error("unable to create new provider");
  }
});

ipcMain.handle("delete-provider", (_, id: number) => {
  try {
    const stmt = db.prepare("DELETE FROM providers WHERE id = ?");
    const result = stmt.run(id);
    if (result.changes === 0) {
      throw new Error(`No provider found with id ${id}`);
    }
    return result;
  } catch (error) {
    console.error("Error deleting provider:", error);
    throw error;
  }
});

ipcMain.handle("update-provider", async (_, provider: Provider) => {
  try {
    const stmt = db.prepare(
      "UPDATE providers SET name = ?, type = ?, baseUrl = ?, apiPath = ?, apiKey = ?, model = ?, config = ? WHERE id = ?"
    );
    return stmt.run(
      provider.name,
      provider.type,
      provider.baseUrl,
      provider.apiPath,
      provider.apiKey,
      provider.model,
      provider.config,
      provider.id
    );
  } catch (error) {
    console.log("unable to update provider", error);
    throw new Error("unable to update provider");
  }
});

ipcMain.handle("select-provider", (_, provider: Provider) => {
  providers.setProvider(provider);
  return true;
});

ipcMain.handle("get-servers", () => {
  return mcp.getServers();
});

ipcMain.handle("add-server", async (_, config: ServerConfig) => {
  try {
    // Install the server and get updated config
    const server = await mcp.serverManager.installServer(config, db);

    // Save to database
    const stmt = db.prepare(`
      INSERT INTO servers (
        name,
        description,
        installType,
        package, 
        startCommand,
        args,
        version,
        enabled
      ) VALUES (?,?,?,?,?,?,?,?)
    `);

    const result = stmt.run(
      server.name,
      server.description || null,
      server.installType,
      server.package,
      server.startCommand || null,
      JSON.stringify(server.args),
      server.version || null,
      server.enabled ? 1 : 0
    );

    if (result.changes === 0) {
      throw new Error("Failed to save server to database");
    }

    return result.lastInsertRowid;
  } catch (error) {
    log.error("Error adding server:", error);
    throw error;
  }
});

ipcMain.handle("delete-server", async (_, id: number) => {
  try {
    const getStmt = db.prepare("SELECT name FROM servers WHERE id = ?");
    const server = getStmt.get(id) as { name: string } | undefined;

    if (!server) {
      throw new Error(`No server found with id ${id}`);
    }

    // Clean up the server
    await mcp.serverManager.cleanupServer(id, server.name);

    // Delete from database
    const deleteStmt = db.prepare("DELETE FROM servers WHERE id = ?");
    const result = deleteStmt.run(id);

    if (result.changes === 0) {
      throw new Error(`Failed to delete server from database`);
    }

    return result;
  } catch (error) {
    log.error("Error deleting server:", error);
    throw error;
  }
});

ipcMain.handle("update-server", (_, config: ServerConfig) => {
  const stmt = db.prepare(`
    UPDATE servers SET
      name = ?,
      description = ?,
      installType = ?,
      package = ?,
      startCommand = ?,
      args = ?,
      version = ?,
      enabled = ?
    WHERE id = ?
  `);

  const args = Array.isArray(config.args) ? JSON.stringify(config.args) : "[]";
  const result = stmt.run(
    config.name,
    config.description || null,
    config.installType,
    config.package,
    config.startCommand || null,
    args,
    config.version || null,
    config.enabled ? 1 : 0,
    config.id
  );
  return result;
});

ipcMain.handle("start-server", async (_, serverId: number) => {
  const stmt = db.prepare("SELECT * FROM servers WHERE id = ?");
  const dbRecord = stmt.get(serverId) as ServerConfig;
  if (!dbRecord) throw new Error("Server not found");

  const server: ServerConfig = {
    id: dbRecord.id,
    name: dbRecord.name,
    description: dbRecord.description || undefined,
    installType: dbRecord.installType,
    package: dbRecord.package,
    startCommand: dbRecord.startCommand || undefined,
    args: JSON.parse(String(dbRecord.args)),
    version: dbRecord.version || undefined,
    enabled: dbRecord.enabled === true,
  };

  return mcp.createClient(server);
});

ipcMain.handle("stop-server", async (_, id: number) => {
  const stmt = db.prepare("SELECT * FROM servers WHERE id = ?");
  const dbRecord = stmt.get(id) as ServerConfig;
  if (!dbRecord) throw new Error("Server not found");

  const server: ServerConfig = {
    id: dbRecord.id,
    name: dbRecord.name,
    description: dbRecord.description || undefined,
    installType: dbRecord.installType,
    package: dbRecord.package,
    startCommand: dbRecord.startCommand || undefined,
    args: JSON.parse(String(dbRecord.args)),
    version: dbRecord.version || undefined,
    enabled: dbRecord.enabled === true,
  };
  return mcp.closeClient(server);
});

ipcMain.handle("get-conversations", () => {
  try {
    const stmt = db.prepare(`
      SELECT 
        c.id, 
        c.providerId, 
        c.title, 
        c.createdAt, 
        c.parent_conversation_id,
        json_group_array(
          json_object(
            'id', m.id,
            'conversationId', m.conversationId,
            'role', m.role,
            'content', m.content,
            'createdAt', m.createdAt
          )
        ) as messages
      FROM conversations c
      LEFT JOIN messages m ON c.id = m.conversationId
      GROUP BY c.id
    `);

    const rawResults = stmt.all() as {
      id: number;
      providerId: number;
      title: string;
      createdAt: string;
      parent_conversation_id: number | null;
      messages: string;
    }[];

    const conversations = rawResults.map((convo) => {
      const parsedMessages = JSON.parse(convo.messages as string);

      return {
        ...convo,
        messages: parsedMessages.filter((m: any) => m.id !== null),
      };
    });

    return conversations;
  } catch (error) {
    console.log("unable to get conversations", error);
    throw error;
  }
});

ipcMain.handle("create-conversation", (_, convo: Partial<Conversation>) => {
  try {
    const stmt = db.prepare(`
    INSERT into conversations (providerId, title, parent_conversation_id ) VALUES(?,?,?)
    `);

    const result = stmt.run(
      convo.providerId,
      convo.title,
      convo.parent_conversation_id || null
    );

    return result.lastInsertRowid;
  } catch (error) {
    console.log("unable to create new conversation");
    throw error;
  }
});

ipcMain.handle("delete-conversation", (_, convoId: number) => {
  try {
    const getStmt = db.prepare("SELECT title FROM conversations WHERE id = ?");
    const convo = getStmt.get(convoId) as { title: string } | undefined;

    if (!convo) {
      throw new Error(`No conversation found with id ${convoId}`);
    }

    db.transaction(() => {
      const deleteMessages = db.prepare(
        "DELETE FROM messages WHERE conversationId = ?"
      );
      deleteMessages.run(convoId);

      const deleteConvo = db.prepare("DELETE FROM conversations WHERE id = ?");
      const result = deleteConvo.run(convoId);

      if (result.changes === 0) {
        throw new Error(`Failed to delete conversation from database`);
      }
    })();

    return { success: true };
  } catch (error) {
    console.log("unable to delete conversation", error);
    throw error;
  }
});

ipcMain.handle("save-message", (_, message: Message) => {
  try {
    const content = message.content.content || message.content;

    const stmt = db.prepare(`
      INSERT INTO messages (
        conversationId,
        role,
        content
      ) VALUES (?, ?, ?)
    `);

    const result = stmt.run(
      message.conversationId,
      message.role,
      JSON.stringify(content) // Store the actual content array
    );

    return result.lastInsertRowid;
  } catch (error) {
    console.log("unable to save message", error);
    throw error;
  }
});

ipcMain.handle("save-messages", (_, messages: Message[]) => {
  try {
    const stmt = db.prepare(`
      INSERT INTO messages (
        conversationId,
        role,
        content
      ) VALUES (?, ?, ?)
    `);

    const results = db.transaction((messages: Message[]) => {
      return messages.map((message) =>
        stmt.run(message.conversationId, message.role, message.content)
      );
    })(messages);

    return results.map((result) => result.lastInsertRowid);
  } catch (error) {
    console.log("unable to save messages", error);
    throw error;
  }
});

ipcMain.handle("delete-message", (_, messageId: number) => {
  try {
    const stmt = db.prepare(`
  DELETE from messages where id = ?`);

    return stmt.run(messageId);
  } catch (error) {
    console.log("unable to delete message", error);
  }
});

ipcMain.handle(
  "update-conversation-title",
  (_, convoId: number, newTitle: string) => {
    try {
      const stmt = db.prepare(`
      UPDATE conversations 
      SET title = ?
      WHERE id = ?
    `);

      const result = stmt.run(newTitle, convoId);

      if (result.changes === 0) {
        throw new Error(`No conversation found with id ${convoId}`);
      }

      return { success: true };
    } catch (error) {
      console.log("unable to update conversation title", error);
      throw error;
    }
  }
);

ipcMain.handle("get-conversation-messages", (_, conversationId: number) => {
  try {
    const stmt = db.prepare(`
      SELECT 
        id,
        conversationId,
        role,
        content,
        createdAt
      FROM messages
      WHERE conversationId = ?
      ORDER BY createdAt ASC
    `);

    return stmt.all(conversationId);
  } catch (error) {
    console.log("unable to get conversation messages", error);
    throw error;
  }
});

ipcMain.handle("chat", async (_, data: Message[]) => {
  if (!providers.getCurrentProvider()) {
    throw new Error("No provider selected");
  }
  return providers.processQuery(data);
});

ipcMain.handle("summarize-context", async (_, data: Message[]) => {
  if (!providers.getCurrentProvider()) {
    throw new Error("No provider selected");
  }
  return providers.summarizeContext(data);
});

ipcMain.handle("login_start", async (_, data: { user: string }) => {
  try {
    console.log("Logging in user from main.ts:", data.user);

    // Call your remote server to get the user token
    const response = await fetch("http://localhost:3008/user-token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ userId: data.user }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Error response from server:", errorData);
      throw new Error(`Server returned error: ${response.status}`);
    }

    // Parse the response from your server
    const tokenData = await response.json();
    console.log("Token received successfully", tokenData);

    // Return the login response structure expected by the frontend
    return {
      user_id: data.user,
      client_config: {
        api_key: tokenData.apiKey,
        user_token: tokenData.userToken,
        channels: [], // You can populate this later if needed
      },
    };
  } catch (error) {
    console.error("Error logging in:", error);
    throw error;
  }
});
// called when Electron has initialized and is ready to create browser windows.
app.on("ready", createWindow);

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    mcp.closeClients();
    app.quit();
  }
});

app.on("will-quit", () => {
  if (db) {
    mcp.closeClients();
    mcp.serverManager.cleanup();
    db.close();
  }
});

app.on("activate", () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
