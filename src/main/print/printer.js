const { BrowserWindow } = require('electron');
const path = require('path');
const { generatePDF } = require('../pdf/generator');
const os = require('os');

async function printOrder(order, mainWindow) {
  return new Promise(async (resolve, reject) => {
    try {
      // Generate PDF in temp directory
      const tempPath = path.join(os.tmpdir(), `temp_order_${order.order_number}.pdf`);
      await generatePDF(order, tempPath);

      // Create hidden window for printing
      const printWindow = new BrowserWindow({
        show: false,
        webPreferences: {
          nodeIntegration: false
        }
      });

      printWindow.loadFile(tempPath);

      printWindow.webContents.on('did-finish-load', () => {
        printWindow.webContents.print({
          silent: false,
          printBackground: true,
          margins: {
            marginType: 'default'
          }
        }, (success, errorType) => {
          if (!success) {
            reject(new Error(errorType));
          } else {
            resolve();
          }
          printWindow.close();
        });
      });

    } catch (error) {
      reject(error);
    }
  });
}

module.exports = { printOrder };

