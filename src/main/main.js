const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const { closeDatabase } = require('./database/schema');
const dbHandlers = require('./database/handlers');
const { generatePDF } = require('./pdf/generator');
const { printOrder } = require('./print/printer');

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
    icon: path.join(__dirname, '../../assets/icon.png')
  });

  // Load the app
  if (process.env.NODE_ENV === 'development' || !app.isPackaged) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../../build/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  createWindow();
  registerIPCHandlers();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

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
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('get-orders', async (event, limit, offset) => {
    try {
      return { success: true, data: dbHandlers.getOrders(limit, offset) };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('get-order-by-id', async (event, id) => {
    try {
      return { success: true, data: dbHandlers.getOrderById(id) };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('search-orders', async (event, searchTerm) => {
    try {
      return { success: true, data: dbHandlers.searchOrders(searchTerm) };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('update-order', async (event, id, orderData) => {
    try {
      dbHandlers.updateOrder(id, orderData);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
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
}

