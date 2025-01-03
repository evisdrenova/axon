import { app, BrowserWindow, ipcMain } from "electron";
import path from "path";
import started from "electron-squirrel-startup";
import Database from "better-sqlite3";
import { McpConfig, Provider } from "./types";

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (started) {
  app.quit();
}

let db = new Database();

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
        name TEXT UNIQUE,
        base_url TEXT NOT NULL,
        api_key TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);
  db.exec(`
      CREATE TABLE IF NOT EXISTS mcp_servers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        command TEXT,
        args TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

  return db;
};

const createWindow = () => {
  // intiilaize the db
  initializeDatabase();

  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
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
  const stmt = db.prepare("SELECT id, name, base_url FROM providers");
  return stmt.all();
});

ipcMain.handle("add-provider", (_, provider: Provider) => {
  const stmt = db.prepare(
    "INSERT INTO providers (name, base_url, api_key) VALUES (?, ?, ?)"
  );
  return stmt.run(provider.name, provider.base_url, provider.api_key);
});

ipcMain.handle("get-mcp-servers", () => {
  const stmt = db.prepare("SELECT id, name, command, args FROM mcp-servers");
  return stmt.all;
});

ipcMain.handle("add-mcp-server", (_, config: McpConfig) => {
  const stmt = db.prepare(
    "INSERT INTO mcp_servers (name, command, args) VALUES(?,?,?)"
  );
  for (const [name, server] of Object.entries(config.mcp_servers)) {
    stmt.run(
      name,
      server.command,
      JSON.stringify(server.args) // store as json string
    );
  }

  return true;
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
