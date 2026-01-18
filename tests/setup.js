/**
 * Jest Setup File
 * Mocks Electron APIs for testing
 */

// Mock Electron
jest.mock('electron', () => ({
  app: {
    getPath: (name) => {
      const paths = {
        userData: '/mock/userData',
        documents: '/mock/documents',
        downloads: '/mock/downloads',
        desktop: '/mock/desktop'
      };
      return paths[name] || '/mock/' + name;
    },
    isPackaged: false,
    isReady: () => true
  },
  dialog: {
    showErrorBox: jest.fn(),
    showOpenDialog: jest.fn()
  },
  session: {
    defaultSession: {
      webRequest: {
        onHeadersReceived: jest.fn()
      }
    }
  },
  BrowserWindow: jest.fn()
}), { virtual: true });

// Set test timeout
jest.setTimeout(10000);

