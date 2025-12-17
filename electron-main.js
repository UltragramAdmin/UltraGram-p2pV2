const { app, BrowserWindow, shell } = require('electron');
const path = require('path');
const fs = require('fs');

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
  app.quit();
}

let mainWindow;

// State preservation (simple implementation without external deps)
const userDataPath = app.getPath('userData');
const stateFile = path.join(userDataPath, 'window-state.json');

function loadWindowState() {
  try {
    return JSON.parse(fs.readFileSync(stateFile, 'utf8'));
  } catch (e) {
    return { width: 1200, height: 800 };
  }
}

function saveWindowState(bounds) {
  try {
    fs.writeFileSync(stateFile, JSON.stringify(bounds));
  } catch (e) {
    console.error('Failed to save window state', e);
  }
}

function createWindow() {
  const windowState = loadWindowState();

  mainWindow = new BrowserWindow({
    width: windowState.width || 1200,
    height: windowState.height || 800,
    x: windowState.x,
    y: windowState.y,
    minWidth: 800,
    minHeight: 600,
    backgroundColor: '#050505', // Match dark theme bg
    titleBarStyle: 'hidden', 
    titleBarOverlay: {
      color: '#00000000', 
      symbolColor: '#8b5cf6', 
      height: 35
    },
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      devTools: true,
    },
    icon: path.join(__dirname, 'assets/icon.png'),
    show: false // Don't show until ready-to-show to prevent white flash
  });

  // Check if we are in development mode
  const isDev = !app.isPackaged;

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, 'dist/index.html'));
  }

  // Graceful showing
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Open external links in default browser, not Electron
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http')) {
      shell.openExternal(url);
      return { action: 'deny' };
    }
    return { action: 'allow' };
  });

  // Save state on close
  mainWindow.on('close', () => {
    if (mainWindow) {
      saveWindowState(mainWindow.getBounds());
    }
  });
}

// Single Instance Lock
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', (event, commandLine, workingDirectory) => {
    // Someone tried to run a second instance, we should focus our window.
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });

  app.whenReady().then(() => {
    createWindow();

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
      }
    });
  });
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});