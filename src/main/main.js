const { app, BrowserWindow, ipcMain, dialog, session } = require('electron');
const path = require('path');
const { autoUpdater } = require('electron-updater');
const { closeDatabase } = require('./database/schema');
const dbHandlers = require('./database/handlers');
const { generatePDF } = require('./pdf/generator');
const { printOrder } = require('./print/printer');
const { formatError } = require('./utils/errorHandler');

// Configure auto-updater
autoUpdater.autoDownload = false; // Don't auto-download, let user initiate
autoUpdater.autoInstallOnAppQuit = true; // Install update when app quits

// Store for update state
let updateState = {
  checking: false,
  available: false,
  downloaded: false,
  downloading: false,
  progress: 0,
  error: null,
  updateInfo: null
};

/**
 * Format error for IPC response with user-friendly message
 */
function handleIPCError(error, context = '') {
  const formatted = formatError(error);
  console.error(`IPC Error [${context}]:`, formatted.technical);
  return {
    success: false,
    error: formatted.message,
    code: formatted.code
  };
}

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    icon: path.join(__dirname, '../../assets/logo.ico')
  });

  // Load the app - only check app.isPackaged for production detection
  // This is the most reliable way to detect production in Electron
  if (!app.isPackaged) {
    // Development mode
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    // Production mode - no DevTools
    mainWindow.loadFile(path.join(__dirname, '../../build/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  // Set Content Security Policy for production
  if (app.isPackaged) {
    session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
      callback({
        responseHeaders: {
          ...details.responseHeaders,
          'Content-Security-Policy': [
            "default-src 'self'; " +
            "script-src 'self'; " +
            "style-src 'self' 'unsafe-inline'; " +
            "img-src 'self' data:; " +
            "font-src 'self' data:; " +
            "connect-src 'self'; " +
            "frame-ancestors 'none';"
          ]
        }
      });
    });
  }

  createWindow();
  registerIPCHandlers();

  // Create automatic backup on app startup (every day)
  scheduleAutoBackup();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

/**
 * Schedule automatic backups
 */
function scheduleAutoBackup() {
  const backupManager = require('./utils/backupManager');
  const ONE_DAY = 24 * 60 * 60 * 1000;

  // Check if we need a backup on startup
  try {
    const stats = backupManager.getBackupStats();
    const lastBackup = stats.latestBackup;

    const shouldBackup = !lastBackup ||
      (new Date() - new Date(lastBackup.created)) > ONE_DAY;

    if (shouldBackup) {
      console.log('Creating automatic backup...');
      backupManager.createBackup('scheduled');
    }
  } catch (error) {
    console.error('Error checking backup status:', error);
  }

  // Schedule daily backup check
  setInterval(() => {
    try {
      console.log('Scheduled backup check...');
      backupManager.createBackup('scheduled');
    } catch (error) {
      console.error('Scheduled backup failed:', error);
    }
  }, ONE_DAY);
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    closeDatabase();
    app.quit();
  }
});

app.on('before-quit', () => {
  closeDatabase();
});

// ============ IPC HANDLERS ============

function registerIPCHandlers() {
  // Dropdown Options
  ipcMain.handle('get-dropdown-options', async (event, category) => {
    try {
      return { success: true, data: dbHandlers.getDropdownOptions(category) };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('get-all-dropdown-options', async () => {
    try {
      return { success: true, data: dbHandlers.getAllDropdownOptions() };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('add-dropdown-option', async (event, option) => {
    try {
      const id = dbHandlers.addDropdownOption(option);
      return { success: true, data: { id } };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('update-dropdown-option', async (event, id, option) => {
    try {
      dbHandlers.updateDropdownOption(id, option);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('delete-dropdown-option', async (event, id) => {
    try {
      dbHandlers.deleteDropdownOption(id);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  // Doctors
  ipcMain.handle('get-doctors', async () => {
    try {
      return { success: true, data: dbHandlers.getDoctors() };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('add-doctor', async (event, name) => {
    try {
      const id = dbHandlers.addDoctor(name);
      return { success: true, data: { id } };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('update-doctor', async (event, id, name) => {
    try {
      dbHandlers.updateDoctor(id, name);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('delete-doctor', async (event, id) => {
    try {
      dbHandlers.deleteDoctor(id);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  // Insurance Providers
  ipcMain.handle('get-insurance-providers', async () => {
    try {
      return { success: true, data: dbHandlers.getInsuranceProviders() };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('add-insurance-provider', async (event, name) => {
    try {
      const id = dbHandlers.addInsuranceProvider(name);
      return { success: true, data: { id } };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('update-insurance-provider', async (event, id, name) => {
    try {
      dbHandlers.updateInsuranceProvider(id, name);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('delete-insurance-provider', async (event, id) => {
    try {
      dbHandlers.deleteInsuranceProvider(id);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  // Employees
  ipcMain.handle('get-employees', async () => {
    try {
      return { success: true, data: dbHandlers.getEmployees() };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('get-all-employees', async () => {
    try {
      return { success: true, data: dbHandlers.getAllEmployees() };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('get-employee-by-id', async (event, id) => {
    try {
      return { success: true, data: dbHandlers.getEmployeeById(id) };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('add-employee', async (event, name, initials) => {
    try {
      const id = dbHandlers.addEmployee(name, initials);
      return { success: true, data: { id } };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('update-employee', async (event, id, name, initials) => {
    try {
      dbHandlers.updateEmployee(id, name, initials);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('delete-employee', async (event, id) => {
    try {
      dbHandlers.deleteEmployee(id);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('reactivate-employee', async (event, id) => {
    try {
      dbHandlers.reactivateEmployee(id);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('hard-delete-employee', async (event, id) => {
    try {
      dbHandlers.hardDeleteEmployee(id);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  // Lens Categories
  ipcMain.handle('get-lens-categories', async () => {
    try {
      return { success: true, data: dbHandlers.getLensCategories() };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('get-active-lens-categories', async () => {
    try {
      return { success: true, data: dbHandlers.getActiveLensCategories() };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('add-lens-category', async (event, category) => {
    try {
      const id = dbHandlers.addLensCategory(category);
      return { success: true, data: { id } };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('update-lens-category', async (event, id, category) => {
    try {
      dbHandlers.updateLensCategory(id, category);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('delete-lens-category', async (event, id) => {
    try {
      dbHandlers.deleteLensCategory(id);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('toggle-lens-category-active', async (event, id) => {
    try {
      dbHandlers.toggleLensCategoryActive(id);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  // Orders
  ipcMain.handle('create-order', async (event, orderData) => {
    try {
      const result = dbHandlers.createOrder(orderData);
      return { success: true, data: result };
    } catch (error) {
      return handleIPCError(error, 'create-order');
    }
  });

  ipcMain.handle('get-orders', async (event, limit, offset) => {
    try {
      return { success: true, data: dbHandlers.getOrders(limit, offset) };
    } catch (error) {
      return handleIPCError(error, 'get-orders');
    }
  });

  ipcMain.handle('get-order-by-id', async (event, id) => {
    try {
      return { success: true, data: dbHandlers.getOrderById(id) };
    } catch (error) {
      return handleIPCError(error, 'get-order-by-id');
    }
  });

  ipcMain.handle('search-orders', async (event, searchTerm) => {
    try {
      return { success: true, data: dbHandlers.searchOrders(searchTerm) };
    } catch (error) {
      return handleIPCError(error, 'search-orders');
    }
  });

  ipcMain.handle('update-order', async (event, id, orderData) => {
    try {
      dbHandlers.updateOrder(id, orderData);
      return { success: true };
    } catch (error) {
      return handleIPCError(error, 'update-order');
    }
  });

  ipcMain.handle('delete-order', async (event, id) => {
    try {
      dbHandlers.deleteOrder(id);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  // Hard delete order (permanent - use with caution)
  ipcMain.handle('hard-delete-order', async (event, id) => {
    try {
      dbHandlers.hardDeleteOrder(id);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  // Restore a soft-deleted order
  ipcMain.handle('restore-order', async (event, id) => {
    try {
      dbHandlers.restoreOrder(id);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  // Get deleted orders for recovery
  ipcMain.handle('get-deleted-orders', async (event, limit) => {
    try {
      return { success: true, data: dbHandlers.getDeletedOrders(limit) };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  // PDF Generation
  ipcMain.handle('generate-pdf', async (event, orderId, savePath) => {
    try {
      const order = dbHandlers.getOrderById(orderId);
      if (!order) {
        return { success: false, error: 'Order not found' };
      }
      const pdfPath = await generatePDF(order, savePath);
      return { success: true, data: { path: pdfPath } };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  // Print
  ipcMain.handle('print-order', async (event, orderId) => {
    try {
      const order = dbHandlers.getOrderById(orderId);
      if (!order) {
        return { success: false, error: 'Order not found' };
      }
      await printOrder(order, mainWindow);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  // Settings
  ipcMain.handle('get-setting', async (event, key) => {
    try {
      const value = dbHandlers.getSetting(key);
      return { success: true, data: value };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('set-setting', async (event, key, value) => {
    try {
      // Validate setting key against whitelist
      if (!dbHandlers.validateSettingKey(key)) {
        return { success: false, error: `Setting '${key}' is not allowed` };
      }

      // Additional validation for specific settings
      if (key === 'pdf_save_location' && value) {
        const { validatePath } = require('./utils/pathValidator');
        const pathCheck = validatePath(value);
        if (!pathCheck.isValid) {
          return { success: false, error: `Invalid path: ${pathCheck.error}` };
        }
        value = pathCheck.resolvedPath;
      }

      if (key === 'tax_rate' && value !== null && value !== '') {
        const rate = parseFloat(value);
        if (isNaN(rate) || rate < 0 || rate > 100) {
          return { success: false, error: 'Tax rate must be between 0 and 100' };
        }
      }

      dbHandlers.setSetting(key, value);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('get-all-settings', async () => {
    try {
      const settings = dbHandlers.getAllSettings();
      return { success: true, data: settings };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  // Directory Picker
  ipcMain.handle('select-directory', async () => {
    try {
      const result = await dialog.showOpenDialog(mainWindow, {
        properties: ['openDirectory', 'createDirectory'],
        title: 'Select PDF Save Location'
      });

      if (result.canceled) {
        return { success: false, canceled: true };
      }

      return { success: true, data: result.filePaths[0] };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  // ============ BACKUP HANDLERS ============
  const backupManager = require('./utils/backupManager');

  ipcMain.handle('create-backup', async (event, reason) => {
    try {
      const result = backupManager.createBackup(reason || 'manual');
      return result;
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('list-backups', async () => {
    try {
      const backups = backupManager.listBackups();
      return { success: true, data: backups };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('restore-backup', async (event, backupPath) => {
    try {
      // Validate path before restore
      const { validatePath } = require('./utils/pathValidator');
      const pathCheck = validatePath(backupPath);
      if (!pathCheck.isValid) {
        return { success: false, error: 'Invalid backup path' };
      }

      const result = backupManager.restoreFromBackup(pathCheck.resolvedPath);
      return result;
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('delete-backup', async (event, backupPath) => {
    try {
      const { validatePath } = require('./utils/pathValidator');
      const pathCheck = validatePath(backupPath);
      if (!pathCheck.isValid) {
        return { success: false, error: 'Invalid backup path' };
      }

      const result = backupManager.deleteBackup(pathCheck.resolvedPath);
      return result;
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('get-backup-stats', async () => {
    try {
      const stats = backupManager.getBackupStats();
      return { success: true, data: stats };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  // App Version
  ipcMain.handle('get-app-version', async () => {
    const packageJson = require('../../package.json');
    return {
      success: true,
      data: {
        version: packageJson.version,
        name: packageJson.productName || packageJson.name,
        electron: process.versions.electron,
        node: process.versions.node
      }
    };
  });

  // ============ AUTO-UPDATE HANDLERS ============

  // Check for updates
  ipcMain.handle('check-for-updates', async () => {
    try {
      // Reset state
      updateState = {
        checking: true,
        available: false,
        downloaded: false,
        downloading: false,
        progress: 0,
        error: null,
        updateInfo: null
      };

      // Check for updates
      const result = await autoUpdater.checkForUpdates();
      return { success: true, data: result };
    } catch (error) {
      updateState.checking = false;
      updateState.error = error.message;
      return { success: false, error: error.message };
    }
  });

  // Download update
  ipcMain.handle('download-update', async () => {
    try {
      updateState.downloading = true;
      updateState.progress = 0;
      await autoUpdater.downloadUpdate();
      return { success: true };
    } catch (error) {
      updateState.downloading = false;
      updateState.error = error.message;
      return { success: false, error: error.message };
    }
  });

  // Install update and restart
  ipcMain.handle('install-update', async () => {
    try {
      autoUpdater.quitAndInstall(false, true);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  // Get current update state
  ipcMain.handle('get-update-state', async () => {
    return { success: true, data: updateState };
  });
}

// ============ AUTO-UPDATER EVENT LISTENERS ============

autoUpdater.on('checking-for-update', () => {
  console.log('Checking for update...');
  updateState.checking = true;
  updateState.error = null;
  if (mainWindow) {
    mainWindow.webContents.send('update-status', { status: 'checking' });
  }
});

autoUpdater.on('update-available', (info) => {
  console.log('Update available:', info.version);
  updateState.checking = false;
  updateState.available = true;
  updateState.updateInfo = {
    version: info.version,
    releaseDate: info.releaseDate,
    releaseNotes: info.releaseNotes
  };
  if (mainWindow) {
    mainWindow.webContents.send('update-status', {
      status: 'available',
      info: updateState.updateInfo
    });
  }
});

autoUpdater.on('update-not-available', (info) => {
  console.log('Update not available, current version is latest');
  updateState.checking = false;
  updateState.available = false;
  if (mainWindow) {
    mainWindow.webContents.send('update-status', {
      status: 'not-available',
      currentVersion: info.version
    });
  }
});

autoUpdater.on('error', (err) => {
  console.error('Update error:', err);
  updateState.checking = false;
  updateState.downloading = false;
  updateState.error = err.message;
  if (mainWindow) {
    mainWindow.webContents.send('update-status', {
      status: 'error',
      error: err.message
    });
  }
});

autoUpdater.on('download-progress', (progressObj) => {
  const percent = Math.round(progressObj.percent);
  console.log(`Download progress: ${percent}%`);
  updateState.progress = percent;
  if (mainWindow) {
    mainWindow.webContents.send('update-status', {
      status: 'downloading',
      progress: percent,
      bytesPerSecond: progressObj.bytesPerSecond,
      transferred: progressObj.transferred,
      total: progressObj.total
    });
  }
});

autoUpdater.on('update-downloaded', (info) => {
  console.log('Update downloaded:', info.version);
  updateState.downloading = false;
  updateState.downloaded = true;
  updateState.updateInfo = {
    version: info.version,
    releaseDate: info.releaseDate,
    releaseNotes: info.releaseNotes
  };
  if (mainWindow) {
    mainWindow.webContents.send('update-status', {
      status: 'downloaded',
      info: updateState.updateInfo
    });
  }
});

