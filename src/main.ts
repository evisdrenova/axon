import { app, BrowserWindow, ipcMain } from "electron";
import path from "path";
import started from "electron-squirrel-startup";
import Database from "better-sqlite3";
import { ServerConfig, Provider } from "./types";
import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";
import log from "electron-log/main";
import { Chat, initializeProvider } from "./providers";

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (started) {
  app.quit();
}

let db = new Database();
log.initialize();

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
        name TEXT,
        command TEXT,
        args TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS conversations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      providerId INTEGER,
      title TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (providerId) REFERENCES providers(id)
);`);

  db.exec(`
  CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    conversationId INTEGER,
    role TEXT,       -- "user" | "assistant" | "system"
    content TEXT,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (conversationId) REFERENCES conversations(id)
);`);

  return db;
};

const createWindow = () => {
  // intiilaize the db
  initializeDatabase();

  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 900,
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
};

ipcMain.handle("db-get-setting", async (_, key) => {
  const stmt = db.prepare("SELECT value FROM settings WHERE key = ?");
  return stmt.get(key);
});

ipcMain.handle("db-set-setting", async (_, key, value) => {
  const stmt = db.prepare(
    "INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)"
  );
  return stmt.run(key, value);
});

ipcMain.handle("get-providers", () => {
  const stmt = db.prepare(
    "SELECT id, name, type, baseUrl, apiPath, apiKey, model, config FROM providers"
  );
  return stmt.all();
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

ipcMain.handle("update-provider", (_, provider: Provider) => {
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

ipcMain.handle("get-servers", () => {
  try {
    const stmt = db.prepare("SELECT id, name, command, args FROM servers");
    const rows = stmt.all() as {
      id: number;
      name: string;
      command: string;
      args: string;
    }[];

    return rows.map((row) => {
      return {
        id: row.id,
        name: row.name,
        command: row.command,
        args: JSON.parse(row.args) as string[],
      };
    });
  } catch (error) {
    console.log("database error", error);
    throw error;
  }
});

ipcMain.handle("add-server", (_, config: ServerConfig) => {
  const stmt = db.prepare(
    "INSERT INTO servers (name, command, args) VALUES(?,?,?)"
  );
  stmt.run(
    config.name,
    config.command,
    JSON.stringify(config.args) // store as json string
  );

  return true;
});

ipcMain.handle("delete-server", (_, id: number) => {
  try {
    const stmt = db.prepare("DELETE FROM servers WHERE id = ?");
    const result = stmt.run(id);
    if (result.changes === 0) {
      throw new Error(`No server found with id ${id}`);
    }
    return result;
  } catch (error) {
    console.error("Error deleting server:", error);
    throw error;
  }
});

ipcMain.handle("update-server", (_, config: ServerConfig) => {
  const stmt = db.prepare(
    "UPDATE servers SET name = ?, command = ?, args = ? WHERE id = ?"
  );
  return stmt.run(
    config.name,
    config.command,
    JSON.stringify(config.args),
    config.id
  );
});

ipcMain.handle("chat", async (_, data) => {
  return Chat(data);
});

// called when Electron has initialized and is ready to create browser windows.
app.on("ready", createWindow);

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("will-quit", () => {
  if (db) {
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
