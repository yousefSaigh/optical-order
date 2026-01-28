const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // Dropdown Options
  getDropdownOptions: (category) => ipcRenderer.invoke('get-dropdown-options', category),
  getAllDropdownOptions: () => ipcRenderer.invoke('get-all-dropdown-options'),
  addDropdownOption: (option) => ipcRenderer.invoke('add-dropdown-option', option),
  updateDropdownOption: (id, option) => ipcRenderer.invoke('update-dropdown-option', id, option),
  deleteDropdownOption: (id) => ipcRenderer.invoke('delete-dropdown-option', id),
  
  // Doctors
  getDoctors: () => ipcRenderer.invoke('get-doctors'),
  addDoctor: (name) => ipcRenderer.invoke('add-doctor', name),
  updateDoctor: (id, name) => ipcRenderer.invoke('update-doctor', id, name),
  deleteDoctor: (id) => ipcRenderer.invoke('delete-doctor', id),

  // Insurance Providers
  getInsuranceProviders: () => ipcRenderer.invoke('get-insurance-providers'),
  addInsuranceProvider: (name) => ipcRenderer.invoke('add-insurance-provider', name),
  updateInsuranceProvider: (id, name) => ipcRenderer.invoke('update-insurance-provider', id, name),
  deleteInsuranceProvider: (id) => ipcRenderer.invoke('delete-insurance-provider', id),

  // Employees
  getEmployees: () => ipcRenderer.invoke('get-employees'),
  getAllEmployees: () => ipcRenderer.invoke('get-all-employees'),
  getEmployeeById: (id) => ipcRenderer.invoke('get-employee-by-id', id),
  addEmployee: (name, initials) => ipcRenderer.invoke('add-employee', name, initials),
  updateEmployee: (id, name, initials) => ipcRenderer.invoke('update-employee', id, name, initials),
  deleteEmployee: (id) => ipcRenderer.invoke('delete-employee', id),
  reactivateEmployee: (id) => ipcRenderer.invoke('reactivate-employee', id),
  hardDeleteEmployee: (id) => ipcRenderer.invoke('hard-delete-employee', id),

  // Lens Categories
  getLensCategories: () => ipcRenderer.invoke('get-lens-categories'),
  getActiveLensCategories: () => ipcRenderer.invoke('get-active-lens-categories'),
  addLensCategory: (category) => ipcRenderer.invoke('add-lens-category', category),
  updateLensCategory: (id, category) => ipcRenderer.invoke('update-lens-category', id, category),
  deleteLensCategory: (id) => ipcRenderer.invoke('delete-lens-category', id),
  toggleLensCategoryActive: (id) => ipcRenderer.invoke('toggle-lens-category-active', id),

  // Orders
  createOrder: (orderData) => ipcRenderer.invoke('create-order', orderData),
  getOrders: (limit, offset) => ipcRenderer.invoke('get-orders', limit, offset),
  getOrderById: (id) => ipcRenderer.invoke('get-order-by-id', id),
  searchOrders: (searchTerm) => ipcRenderer.invoke('search-orders', searchTerm),
  updateOrder: (id, orderData) => ipcRenderer.invoke('update-order', id, orderData),
  deleteOrder: (id) => ipcRenderer.invoke('delete-order', id),

  // Order Recovery (soft delete)
  hardDeleteOrder: (id) => ipcRenderer.invoke('hard-delete-order', id),
  restoreOrder: (id) => ipcRenderer.invoke('restore-order', id),
  getDeletedOrders: (limit) => ipcRenderer.invoke('get-deleted-orders', limit),

  // PDF & Print
  generatePDF: (orderId, savePath) => ipcRenderer.invoke('generate-pdf', orderId, savePath),
  printOrder: (orderId) => ipcRenderer.invoke('print-order', orderId),

  // Settings
  getSetting: (key) => ipcRenderer.invoke('get-setting', key),
  setSetting: (key, value) => ipcRenderer.invoke('set-setting', key, value),
  getAllSettings: () => ipcRenderer.invoke('get-all-settings'),
  selectDirectory: () => ipcRenderer.invoke('select-directory'),

  // Backup Management
  createBackup: (reason) => ipcRenderer.invoke('create-backup', reason),
  listBackups: () => ipcRenderer.invoke('list-backups'),
  restoreBackup: (backupPath) => ipcRenderer.invoke('restore-backup', backupPath),
  deleteBackup: (backupPath) => ipcRenderer.invoke('delete-backup', backupPath),
  getBackupStats: () => ipcRenderer.invoke('get-backup-stats'),

  // App Info
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),

  // Auto-Update APIs
  checkForUpdates: () => ipcRenderer.invoke('check-for-updates'),
  downloadUpdate: () => ipcRenderer.invoke('download-update'),
  installUpdate: () => ipcRenderer.invoke('install-update'),
  getUpdateState: () => ipcRenderer.invoke('get-update-state'),
  onUpdateStatus: (callback) => {
    ipcRenderer.on('update-status', (event, data) => callback(data));
  },
  removeUpdateStatusListener: () => {
    ipcRenderer.removeAllListeners('update-status');
  }
});

