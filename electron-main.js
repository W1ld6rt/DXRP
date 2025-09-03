// ====== DXPR - Electron Main Process ======

/**
 * Electron main process for cross-platform desktop application
 * Inspired by Electron.js best practices and architecture
 */

const { app, BrowserWindow, Menu, ipcMain, dialog, shell, screen } = require('electron');
const { autoUpdater } = require('electron-updater');
const path = require('path');
const isDev = require('electron-is-dev');
const { spawn } = require('child_process');
const fs = require('fs');
const os = require('os');

// Keep a global reference of the window object
let mainWindow;
let splashWindow;
let settingsWindow;
let flaskProcess;

// App configuration
const APP_CONFIG = {
  name: 'DXPR - Dexter Presenter Remote',
  version: app.getVersion(),
  minWidth: 1024,
  minHeight: 768,
  defaultWidth: 1400,
  defaultHeight: 900,
  flaskPort: 5000
};

/**
 * Create the main application window
 */
function createMainWindow() {
  // Get primary display dimensions
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width, height } = primaryDisplay.workAreaSize;

  // Create the browser window
  mainWindow = new BrowserWindow({
    width: Math.min(APP_CONFIG.defaultWidth, width - 100),
    height: Math.min(APP_CONFIG.defaultHeight, height - 100),
    minWidth: APP_CONFIG.minWidth,
    minHeight: APP_CONFIG.minHeight,
    show: false, // Don't show until ready
    icon: path.join(__dirname, 'static', 'icon-512.png'),
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      preload: path.join(__dirname, 'electron-preload.js'),
      webSecurity: !isDev
    }
  });

  // Load the app
  if (isDev) {
    mainWindow.loadURL('http://localhost:5000');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadURL(`http://localhost:${APP_CONFIG.flaskPort}`);
  }

  // Show window when ready to prevent visual flash
  mainWindow.once('ready-to-show', () => {
    if (splashWindow) {
      splashWindow.close();
    }
    mainWindow.show();
    
    // Focus on window
    if (isDev) {
      mainWindow.focus();
    }
  });

  // Handle window closed
  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Handle external links
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  // Prevent navigation to external sites
  mainWindow.webContents.on('will-navigate', (event, navigationUrl) => {
    const parsedUrl = new URL(navigationUrl);
    
    if (parsedUrl.origin !== `http://localhost:${APP_CONFIG.flaskPort}`) {
      event.preventDefault();
    }
  });
}

/**
 * Create splash screen
 */
function createSplashWindow() {
  splashWindow = new BrowserWindow({
    width: 400,
    height: 300,
    frame: false,
    alwaysOnTop: true,
    transparent: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  // TODO: Crear archivo electron-splash.html
  // splashWindow.loadFile(path.join(__dirname, 'electron-splash.html'));
  splashWindow.loadURL('data:text/html,<html><body style="background:#6750a4;color:white;display:flex;align-items:center;justify-content:center;font-family:Inter,sans-serif;"><h1>DXPR Loading...</h1></body></html>');

  splashWindow.on('closed', () => {
    splashWindow = null;
  });
}

/**
 * Create settings window
 */
function createSettingsWindow() {
  if (settingsWindow) {
    settingsWindow.focus();
    return;
  }

  settingsWindow = new BrowserWindow({
    width: 600,
    height: 500,
    parent: mainWindow,
    modal: true,
    show: false,
    resizable: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'electron-preload.js')
    }
  });

  // TODO: Crear archivo electron-settings.html
  // settingsWindow.loadFile(path.join(__dirname, 'electron-settings.html'));
  settingsWindow.loadURL('data:text/html,<html><body style="background:#f5f5f5;padding:20px;font-family:Inter,sans-serif;"><h2>Settings</h2><p>Settings panel coming soon...</p></body></html>');

  settingsWindow.once('ready-to-show', () => {
    settingsWindow.show();
  });

  settingsWindow.on('closed', () => {
    settingsWindow = null;
  });
}

/**
 * Start Flask backend server
 */
function startFlaskServer() {
  return new Promise((resolve, reject) => {
    const pythonExecutable = isDev ? 'python' : path.join(process.resourcesPath, 'python', 'python.exe');
    const scriptPath = isDev ? 'app.py' : path.join(process.resourcesPath, 'app', 'app.py');
    
    flaskProcess = spawn(pythonExecutable, [scriptPath], {
      cwd: isDev ? __dirname : path.join(process.resourcesPath, 'app'),
      stdio: ['pipe', 'pipe', 'pipe']
    });

    flaskProcess.stdout.on('data', (data) => {
      console.log(`Flask: ${data}`);
      if (data.toString().includes('Running on')) {
        resolve();
      }
    });

    flaskProcess.stderr.on('data', (data) => {
      console.error(`Flask Error: ${data}`);
    });

    flaskProcess.on('close', (code) => {
      console.log(`Flask process exited with code ${code}`);
    });

    flaskProcess.on('error', (error) => {
      console.error('Failed to start Flask server:', error);
      reject(error);
    });

    // Timeout after 10 seconds
    setTimeout(() => {
      reject(new Error('Flask server startup timeout'));
    }, 10000);
  });
}

/**
 * Create application menu
 */
function createMenu() {
  const template = [
    {
      label: 'Archivo',
      submenu: [
        {
          label: 'Nuevo Proyecto',
          accelerator: 'CmdOrCtrl+N',
          click: () => {
            // Handle new project
            mainWindow.webContents.send('menu-new-project');
          }
        },
        {
          label: 'Abrir Proyecto',
          accelerator: 'CmdOrCtrl+O',
          click: async () => {
            const result = await dialog.showOpenDialog(mainWindow, {
              properties: ['openDirectory'],
              title: 'Seleccionar carpeta del proyecto'
            });
            
            if (!result.canceled) {
              mainWindow.webContents.send('menu-open-project', result.filePaths[0]);
            }
          }
        },
        { type: 'separator' },
        {
          label: 'Configuración',
          accelerator: 'CmdOrCtrl+,',
          click: () => {
            createSettingsWindow();
          }
        },
        { type: 'separator' },
        {
          label: 'Salir',
          accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
          click: () => {
            app.quit();
          }
        }
      ]
    },
    {
      label: 'Editar',
      submenu: [
        { label: 'Deshacer', accelerator: 'CmdOrCtrl+Z', role: 'undo' },
        { label: 'Rehacer', accelerator: 'Shift+CmdOrCtrl+Z', role: 'redo' },
        { type: 'separator' },
        { label: 'Cortar', accelerator: 'CmdOrCtrl+X', role: 'cut' },
        { label: 'Copiar', accelerator: 'CmdOrCtrl+C', role: 'copy' },
        { label: 'Pegar', accelerator: 'CmdOrCtrl+V', role: 'paste' }
      ]
    },
    {
      label: 'Ver',
      submenu: [
        { label: 'Recargar', accelerator: 'CmdOrCtrl+R', role: 'reload' },
        { label: 'Forzar Recarga', accelerator: 'CmdOrCtrl+Shift+R', role: 'forceReload' },
        { label: 'Herramientas de Desarrollador', accelerator: 'F12', role: 'toggleDevTools' },
        { type: 'separator' },
        { label: 'Zoom Real', accelerator: 'CmdOrCtrl+0', role: 'resetZoom' },
        { label: 'Acercar', accelerator: 'CmdOrCtrl+Plus', role: 'zoomIn' },
        { label: 'Alejar', accelerator: 'CmdOrCtrl+-', role: 'zoomOut' },
        { type: 'separator' },
        { label: 'Pantalla Completa', accelerator: 'F11', role: 'togglefullscreen' }
      ]
    },
    {
      label: 'Presentación',
      submenu: [
        {
          label: 'Iniciar Streaming',
          accelerator: 'F5',
          click: () => {
            mainWindow.webContents.send('menu-start-streaming');
          }
        },
        {
          label: 'Detener Streaming',
          accelerator: 'Shift+F5',
          click: () => {
            mainWindow.webContents.send('menu-stop-streaming');
          }
        },
        { type: 'separator' },
        {
          label: 'Pantalla de Visualización',
          accelerator: 'CmdOrCtrl+D',
          click: () => {
            shell.openExternal(`http://localhost:${APP_CONFIG.flaskPort}/display`);
          }
        }
      ]
    },
    {
      label: 'Ayuda',
      submenu: [
        {
          label: 'Acerca de',
          click: () => {
            dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: 'Acerca de DXPR',
              message: APP_CONFIG.name,
              detail: `Versión: ${APP_CONFIG.version}\nSistema de control para presentaciones en vivo`
            });
          }
        },
        {
          label: 'Documentación',
          click: () => {
            shell.openExternal('https://github.com/your-repo/dxpr');
          }
        }
      ]
    }
  ];

  // macOS specific menu adjustments
  if (process.platform === 'darwin') {
    template.unshift({
      label: app.getName(),
      submenu: [
        { label: 'Acerca de ' + app.getName(), role: 'about' },
        { type: 'separator' },
        { label: 'Servicios', role: 'services', submenu: [] },
        { type: 'separator' },
        { label: 'Ocultar ' + app.getName(), accelerator: 'Command+H', role: 'hide' },
        { label: 'Ocultar Otros', accelerator: 'Command+Shift+H', role: 'hideothers' },
        { label: 'Mostrar Todo', role: 'unhide' },
        { type: 'separator' },
        { label: 'Salir', accelerator: 'Command+Q', click: () => app.quit() }
      ]
    });
  }

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

/**
 * Setup auto updater
 */
function setupAutoUpdater() {
  if (isDev) return;

  autoUpdater.checkForUpdatesAndNotify();

  autoUpdater.on('update-available', () => {
    dialog.showMessageBox(mainWindow, {
      type: 'info',
      title: 'Actualización disponible',
      message: 'Una nueva versión está disponible. Se descargará en segundo plano.',
      buttons: ['OK']
    });
  });

  autoUpdater.on('update-downloaded', () => {
    dialog.showMessageBox(mainWindow, {
      type: 'info',
      title: 'Actualización lista',
      message: 'La actualización se ha descargado. Se instalará al reiniciar la aplicación.',
      buttons: ['Reiniciar ahora', 'Más tarde']
    }).then((result) => {
      if (result.response === 0) {
        autoUpdater.quitAndInstall();
      }
    });
  });
}

/**
 * Setup IPC handlers
 */
function setupIPC() {
  // Handle app info requests
  ipcMain.handle('get-app-info', () => {
    return {
      name: APP_CONFIG.name,
      version: APP_CONFIG.version,
      platform: process.platform,
      arch: process.arch
    };
  });

  // Handle file operations
  ipcMain.handle('show-save-dialog', async (event, options) => {
    const result = await dialog.showSaveDialog(mainWindow, options);
    return result;
  });

  ipcMain.handle('show-open-dialog', async (event, options) => {
    const result = await dialog.showOpenDialog(mainWindow, options);
    return result;
  });

  // Handle external links
  ipcMain.handle('open-external', async (event, url) => {
    await shell.openExternal(url);
  });

  // Handle notifications
  ipcMain.handle('show-notification', (event, options) => {
    new Notification(options.title, {
      body: options.body,
      icon: options.icon
    }).show();
  });
}

// App event handlers
app.whenReady().then(async () => {
  try {
    // Create splash screen
    createSplashWindow();
    
    // Start Flask server
    await startFlaskServer();
    
    // Create main window
    createMainWindow();
    
    // Create menu
    createMenu();
    
    // Setup IPC
    setupIPC();
    
    // Setup auto updater
    setupAutoUpdater();
    
  } catch (error) {
    console.error('Failed to start application:', error);
    
    dialog.showErrorBox('Error de inicio', 
      'No se pudo iniciar la aplicación. Verifique que Python esté instalado correctamente.');
    
    app.quit();
  }
});

app.on('window-all-closed', () => {
  // Kill Flask process
  if (flaskProcess) {
    flaskProcess.kill();
  }
  
  // On macOS, keep app running even when all windows are closed
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On macOS, re-create window when dock icon is clicked
  if (BrowserWindow.getAllWindows().length === 0) {
    createMainWindow();
  }
});

// Security: Prevent new window creation
app.on('web-contents-created', (event, contents) => {
  contents.on('new-window', (event, navigationUrl) => {
    event.preventDefault();
    shell.openExternal(navigationUrl);
  });
});

// Handle certificate errors
app.on('certificate-error', (event, webContents, url, error, certificate, callback) => {
  if (isDev) {
    // In development, ignore certificate errors
    event.preventDefault();
    callback(true);
  } else {
    // In production, use default behavior
    callback(false);
  }
});

// Prevent navigation to external sites
app.on('web-contents-created', (event, contents) => {
  contents.on('will-navigate', (event, navigationUrl) => {
    const parsedUrl = new URL(navigationUrl);
    
    if (parsedUrl.origin !== `http://localhost:${APP_CONFIG.flaskPort}`) {
      event.preventDefault();
    }
  });
});