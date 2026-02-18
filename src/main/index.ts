import { app, BrowserWindow, session, shell } from 'electron';
import path from 'path';
import { initDb } from './store/db';
import { registerIpcHandlers } from './ipc-handlers';
import { startExpressServer, stopExpressServer } from './server-launcher';
import { mcpManager } from './mcp/mcp-manager';

declare const MAIN_WINDOW_WEBPACK_ENTRY: string;
declare const MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY: string;

if (require('electron-squirrel-startup')) {
  app.quit();
}

// Register nexus:// protocol for deep links
if (process.defaultApp) {
  if (process.argv.length >= 2) {
    app.setAsDefaultProtocolClient('nexus', process.execPath, [path.resolve(process.argv[1])]);
  }
} else {
  app.setAsDefaultProtocolClient('nexus');
}

let mainWindow: BrowserWindow | null = null;

const createWindow = (): void => {
  // Disable CSP restrictions for development
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [''],
      },
    });
  });

  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 900,
    minHeight: 600,
    backgroundColor: '#ffffff',
    titleBarStyle: 'hiddenInset',
    webPreferences: {
      preload: MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY,
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  mainWindow.loadURL(MAIN_WINDOW_WEBPACK_ENTRY);
};

function handleDeepLink(url: string): void {
  if (!mainWindow) return;
  try {
    const parsed = new URL(url);
    if (parsed.hostname === 'auth-callback') {
      const params: Record<string, string> = {};
      parsed.searchParams.forEach((value, key) => {
        params[key] = value;
      });
      mainWindow.webContents.send('auth:callback', params);
    }
  } catch (err) {
    console.error('Deep link parse error:', err);
  }
}

// macOS: open-url event for deep links
app.on('open-url', (event, url) => {
  event.preventDefault();
  handleDeepLink(url);
});

// Single instance lock (non-macOS) — handles deep link from second instance
if (process.platform !== 'darwin') {
  const gotTheLock = app.requestSingleInstanceLock();
  if (!gotTheLock) {
    app.quit();
  } else {
    app.on('second-instance', (_event, commandLine) => {
      const url = commandLine.find(arg => arg.startsWith('nexus://'));
      if (url) handleDeepLink(url);
      if (mainWindow) {
        if (mainWindow.isMinimized()) mainWindow.restore();
        mainWindow.focus();
      }
    });
  }
}

app.on('ready', async () => {
  initDb();
  registerIpcHandlers();
  startExpressServer();
  await mcpManager.initialize();
  createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', async () => {
  stopExpressServer();
  await mcpManager.shutdown();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
