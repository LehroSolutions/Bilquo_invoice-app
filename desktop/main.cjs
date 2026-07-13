const path = require('node:path');
const { BrowserWindow, app } = require('electron');
const { createStaticServer } = require('./static-server.cjs');

let mainWindow = null;
let rendererTarget = null;

async function resolveRendererTarget() {
  const devUrl =
    process.env.BILQUO_DEV_URL ||
    process.env.ELECTRON_START_URL ||
    (!app.isPackaged ? 'http://127.0.0.1:3000' : '');

  if (devUrl) {
    return {
      close: async () => {},
      url: devUrl,
    };
  }

  if (!rendererTarget) {
    const rootDir = app.isPackaged ? path.join(app.getAppPath(), 'out') : path.join(process.cwd(), 'out');
    rendererTarget = await createStaticServer(rootDir, { host: '127.0.0.1', port: 0 });
  }

  return rendererTarget;
}

async function createMainWindow() {
  const target = await resolveRendererTarget();

  mainWindow = new BrowserWindow({
    autoHideMenuBar: true,
    backgroundColor: '#f8fafc',
    height: 1100,
    minHeight: 900,
    minWidth: 1360,
    show: false,
    title: 'Bilquo',
    width: 1720,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  await mainWindow.loadURL(target.url);
}

app.whenReady().then(async () => {
  try {
    await createMainWindow();
  } catch (error) {
    console.error('[Bilquo] Failed to start the desktop shell:', error);
    app.quit();
  }
});

app.on('activate', async () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    await createMainWindow();
  }
});

app.on('before-quit', () => {
  void rendererTarget?.close?.();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
