import { app, BrowserWindow, ipcMain, screen } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow = null;

function createWindow() {
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width, height } = primaryDisplay.workAreaSize;

  mainWindow = new BrowserWindow({
    width: Math.min(1366, width),
    height: Math.min(768, height),
    minWidth: 1024,
    minHeight: 640,
    title: 'غِراس المواطنة - مغامرة المواطن الصغير 3D',
    autoHideMenuBar: true,
    backgroundColor: '#0a101d',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true
    },
    icon: path.join(__dirname, 'public/favicon.ico')
  });

  // Try connecting to Vite dev server (5173 or 5174), or fallback to built dist
  async function loadApp() {
    const ports = [5173, 5174];
    for (const p of ports) {
      try {
        const res = await fetch(`http://localhost:${p}`);
        if (res.ok) {
          mainWindow.loadURL(`http://localhost:${p}`);
          return;
        }
      } catch (e) {
        // try next
      }
    }
    mainWindow.loadFile(path.join(__dirname, 'dist/index.html'));
  }

  loadApp();

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
