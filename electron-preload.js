// ====== DXPR - Electron Preload Script ======

/**
 * Preload script for secure communication between main and renderer processes
 * Implements Electron security best practices
 */

const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // App information
  getAppInfo: () => ipcRenderer.invoke('get-app-info'),
  
  // File operations
  showSaveDialog: (options) => ipcRenderer.invoke('show-save-dialog', options),
  showOpenDialog: (options) => ipcRenderer.invoke('show-open-dialog', options),
  
  // External operations
  openExternal: (url) => ipcRenderer.invoke('open-external', url),
  
  // Notifications
  showNotification: (options) => ipcRenderer.invoke('show-notification', options),
  
  // Menu events (one-way from main to renderer)
  onMenuAction: (callback) => {
    const validChannels = [
      'menu-new-project',
      'menu-open-project', 
      'menu-start-streaming',
      'menu-stop-streaming'
    ];
    
    validChannels.forEach(channel => {
      ipcRenderer.on(channel, (event, ...args) => callback(channel, ...args));
    });
  },
  
  // Remove menu listeners
  removeMenuListeners: () => {
    const validChannels = [
      'menu-new-project',
      'menu-open-project',
      'menu-start-streaming', 
      'menu-stop-streaming'
    ];
    
    validChannels.forEach(channel => {
      ipcRenderer.removeAllListeners(channel);
    });
  },
  
  // Platform information
  platform: process.platform,
  
  // Version information
  versions: {
    node: process.versions.node,
    chrome: process.versions.chrome,
    electron: process.versions.electron
  }
});

// Expose desktop-specific utilities
contextBridge.exposeInMainWorld('desktopUtils', {
  // Check if running in Electron
  isElectron: true,
  
  // Platform detection
  isMac: process.platform === 'darwin',
  isWindows: process.platform === 'win32',
  isLinux: process.platform === 'linux',
  
  // Feature detection
  hasNativeMenus: process.platform === 'darwin',
  hasSystemTray: true,
  hasAutoUpdater: true,
  
  // Desktop integration helpers
  async saveFile(data, filename, filters = []) {
    try {
      const result = await ipcRenderer.invoke('show-save-dialog', {
        defaultPath: filename,
        filters: filters.length > 0 ? filters : [
          { name: 'All Files', extensions: ['*'] }
        ]
      });
      
      if (!result.canceled) {
        // In a real implementation, you'd save the file here
        // This would require additional IPC handlers in the main process
        return { success: true, path: result.filePath };
      }
      
      return { success: false, canceled: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },
  
  async openFile(filters = []) {
    try {
      const result = await ipcRenderer.invoke('show-open-dialog', {
        properties: ['openFile'],
        filters: filters.length > 0 ? filters : [
          { name: 'All Files', extensions: ['*'] }
        ]
      });
      
      if (!result.canceled && result.filePaths.length > 0) {
        return { success: true, path: result.filePaths[0] };
      }
      
      return { success: false, canceled: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },
  
  async openDirectory() {
    try {
      const result = await ipcRenderer.invoke('show-open-dialog', {
        properties: ['openDirectory']
      });
      
      if (!result.canceled && result.filePaths.length > 0) {
        return { success: true, path: result.filePaths[0] };
      }
      
      return { success: false, canceled: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },
  
  // Notification helper
  async notify(title, body, icon = null) {
    try {
      await ipcRenderer.invoke('show-notification', {
        title,
        body,
        icon
      });
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
});

// Expose theme utilities for desktop integration
contextBridge.exposeInMainWorld('themeAPI', {
  // System theme detection
  getSystemTheme: () => {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  },
  
  // Listen for system theme changes
  onSystemThemeChange: (callback) => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e) => callback(e.matches ? 'dark' : 'light');
    
    mediaQuery.addEventListener('change', handler);
    
    // Return cleanup function
    return () => mediaQuery.removeEventListener('change', handler);
  },
  
  // Apply native window styling
  applyNativeWindowStyling: (theme) => {
    // This would be implemented with additional IPC calls
    // to update the native window appearance
    console.log(`Applying native window styling: ${theme}`);
  }
});

// Expose performance utilities
contextBridge.exposeInMainWorld('performanceAPI', {
  // Memory usage
  getMemoryUsage: () => {
    return {
      used: process.memoryUsage(),
      system: process.getSystemMemoryInfo ? process.getSystemMemoryInfo() : null
    };
  },
  
  // CPU usage (basic)
  getCPUUsage: () => {
    return process.getCPUUsage ? process.getCPUUsage() : null;
  },
  
  // Performance timing
  now: () => performance.now(),
  
  // Mark performance events
  mark: (name) => performance.mark(name),
  
  // Measure performance
  measure: (name, startMark, endMark) => {
    try {
      performance.measure(name, startMark, endMark);
      return performance.getEntriesByName(name, 'measure')[0];
    } catch (error) {
      return null;
    }
  }
});

// Security: Remove Node.js globals from renderer
delete window.require;
delete window.exports;
delete window.module;

// Add desktop-specific CSS classes to body when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  document.body.classList.add('electron-app');
  document.body.classList.add(`platform-${process.platform}`);
  
  // Add platform-specific styling
  if (process.platform === 'darwin') {
    document.body.classList.add('macos');
  } else if (process.platform === 'win32') {
    document.body.classList.add('windows');
  } else if (process.platform === 'linux') {
    document.body.classList.add('linux');
  }
  
  // Add Electron version info
  document.documentElement.setAttribute('data-electron-version', process.versions.electron);
});

// Console branding for development
if (process.env.NODE_ENV === 'development') {
  console.log('%c🚀 DXPR Desktop App', 'color: #6750a4; font-size: 16px; font-weight: bold;');
  console.log('%cElectron version:', 'color: #666;', process.versions.electron);
  console.log('%cNode version:', 'color: #666;', process.versions.node);
  console.log('%cChrome version:', 'color: #666;', process.versions.chrome);
}