const { BrowserWindow } = require('electron');
const path = require('path');
const os = require('os');
const fs = require('fs');

// Helper function to format currency
function formatCurrency(value) {
  const num = parseFloat(value) || 0;
  return `$${num.toFixed(2)}`;
}

// Helper function to generate HTML content for printing
function generatePrintHTML(order) {
  // Parse lens selections from JSON
  let lensItems = [];

  try {
    if (order.lens_selections_json) {
      const lensSelections = JSON.parse(order.lens_selections_json);
      Object.entries(lensSelections).forEach(([category, selection]) => {
        if (selection && selection.option_name && selection.option_name !== 'None') {
          lensItems.push({
            label: category,
            value: selection.option_name,
            price: selection.price || 0
          });
        }
      });
    }
  } catch (e) {
    console.error('Error parsing lens selections:', e);
  }

  // Fallback to legacy fields if no JSON data
  if (lensItems.length === 0) {
    const legacyItems = [
      { label: 'Lens Design', value: order.lens_design, price: order.lens_design_price },
      { label: 'Lens Material', value: order.lens_material, price: order.lens_material_price },
      { label: 'AR Non-Glare Coating', value: order.ar_coating, price: order.ar_coating_price },
      { label: 'Blue Light Guard', value: order.blue_light, price: order.blue_light_price },
      { label: 'Transition/Polarized', value: order.transition_polarized, price: order.transition_polarized_price },
      { label: 'Aspheric', value: order.aspheric, price: order.aspheric_price },
      { label: 'Edge Treatment', value: order.edge_treatment, price: order.edge_treatment_price },
      { label: 'Prism', value: order.prism, price: order.prism_price },
      { label: 'Other Add-Ons', value: order.other_option, price: order.other_option_price },
    ];

    legacyItems.forEach(item => {
      if (item.value && item.value !== 'None') {
        lensItems.push(item);
      }
    });
  }

  // Build lens selections HTML
  let lensSelectionsHTML = '';
  lensItems.forEach(item => {
    lensSelectionsHTML += `
      <tr>
        <td style="padding: 4px 8px; border-bottom: 1px solid #ddd;">${item.label}:</td>
        <td style="padding: 4px 8px; border-bottom: 1px solid #ddd; text-align: right;">${item.value}</td>
        <td style="padding: 4px 8px; border-bottom: 1px solid #ddd; text-align: right;">${formatCurrency(item.price)}</td>
      </tr>
    `;
  });

  // Add total lens charges
  if (lensItems.length > 0) {
    lensSelectionsHTML += `
      <tr style="background-color: #f0f0f0; font-weight: bold;">
        <td colspan="2" style="padding: 6px 8px; border-top: 2px solid #333;">Total Lens Charges:</td>
        <td style="padding: 6px 8px; border-top: 2px solid #333; text-align: right;">${formatCurrency(order.total_lens_charges)}</td>
      </tr>
    `;
  }

  // Calculate other % adjustment amount
  const baseAmount = (order.final_price || 0) - (order.payment_today || 0);
  const percentAdjustment = baseAmount * ((order.other_percent_adjustment || 0) / 100);

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Order ${order.order_number}</title>
  <style>
    @page {
      size: letter;
      margin: 0.5in;
    }

    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: Arial, sans-serif;
      font-size: 10pt;
      line-height: 1.3;
      color: #000;
    }

    .header {
      text-align: center;
      margin-bottom: 12px;
      border-bottom: 2px solid #000;
      padding-bottom: 8px;
    }

    .header h1 {
      font-size: 16pt;
      margin-bottom: 4px;
    }

    .header h2 {
      font-size: 12pt;
      font-weight: normal;
    }

    .order-info {
      display: flex;
      justify-content: space-between;
      margin-bottom: 12px;
      font-size: 9pt;
    }

    .section {
      margin-bottom: 10px;
      page-break-inside: avoid;
    }

    .section-title {
      font-size: 11pt;
      font-weight: bold;
      background-color: #f0f0f0;
      padding: 3px 6px;
      border-left: 3px solid #333;
      margin-bottom: 4px;
    }

    table {
      width: 100%;
      border-collapse: collapse;
    }

    td {
      padding: 3px 6px;
      border-bottom: 1px solid #e0e0e0;
    }

    .prescription-grid {
      width: 100%;
      border-collapse: collapse;
      margin: 4px 0;
    }

    .prescription-grid td,
    .prescription-grid th {
      padding: 3px;
      border: 1px solid #ddd;
      text-align: center;
      font-size: 9pt;
    }

    .prescription-grid th {
      background-color: #f0f0f0;
      font-weight: bold;
    }

    @media print {
      body {
        print-color-adjust: exact;
        -webkit-print-color-adjust: exact;
      }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>Quality Eye Clinic Elgin</h1>
    <h2>Optical Order</h2>
  </div>

  <div class="order-info">
    <div><strong>Order Number:</strong> ${order.order_number}</div>
    <div><strong>Date:</strong> ${order.order_date}</div>
  </div>

  <!-- Patient Information -->
  <div class="section">
    <div class="section-title">Patient Information</div>
    <table>
      <tr>
        <td style="width: 30%;"><strong>Patient Name:</strong></td>
        <td>${order.patient_name || ''}</td>
      </tr>
      <tr>
        <td><strong>Doctor:</strong></td>
        <td>${order.doctor_name || ''}</td>
      </tr>
      <tr>
        <td><strong>Account Number:</strong></td>
        <td>${order.account_number || ''}</td>
      </tr>
      <tr>
        <td><strong>Insurance:</strong></td>
        <td>${order.insurance || ''}</td>
      </tr>
      <tr>
        <td><strong>Sold By:</strong></td>
        <td>${order.sold_by || ''}</td>
      </tr>
    </table>
  </div>

  <!-- Prescription -->
  <div class="section">
    <div class="section-title">Prescription Details</div>
    <table class="prescription-grid">
      <tr>
        <th></th>
        <th>OD (Right)</th>
        <th>OS (Left)</th>
      </tr>
      <tr>
        <th>PD</th>
        <td>${order.od_pd || ''}</td>
        <td>${order.os_pd || ''}</td>
      </tr>
      <tr>
        <th>Seg Height</th>
        <td>${order.od_seg_height || ''}</td>
        <td>${order.os_seg_height || ''}</td>
      </tr>
    </table>
  </div>

  <!-- Frame Information -->
  <div class="section">
    <div class="section-title">Frame Information</div>
    <table>
      <tr>
        <td style="width: 30%;"><strong>SKU:</strong></td>
        <td>${order.frame_sku || ''}</td>
      </tr>
      <tr>
        <td><strong>Name:</strong></td>
        <td>${order.frame_name || ''}</td>
      </tr>
      <tr>
        <td><strong>Material:</strong></td>
        <td>${order.frame_material || ''}</td>
      </tr>
      <tr>
        <td><strong>Frame Price:</strong></td>
        <td>${formatCurrency(order.frame_price)}</td>
      </tr>
      ${(order.frame_allowance > 0 || order.frame_discount_percent > 0) ? `
      <tr>
        <td colspan="2" style="padding-top: 10px;">
          <strong style="color: #666;">Insurance Frame Allowance:</strong>
        </td>
      </tr>
      ${order.frame_allowance > 0 ? `
      <tr>
        <td style="padding-left: 20px;"><strong>Allowance:</strong></td>
        <td style="color: #dc3545;">-${formatCurrency(order.frame_allowance)}</td>
      </tr>
      ` : ''}
      ${order.frame_discount_percent > 0 ? `
      <tr>
        <td style="padding-left: 20px;"><strong>Discount:</strong></td>
        <td style="color: #dc3545;">${order.frame_discount_percent.toFixed(2)}% (-${formatCurrency(((order.frame_price || 0) - (order.frame_allowance || 0)) * ((order.frame_discount_percent || 0) / 100))})</td>
      </tr>
      ` : ''}
      <tr>
        <td style="padding-left: 20px;"><strong>Final Frame Price:</strong></td>
        <td><strong>${formatCurrency(order.final_frame_price)}</strong></td>
      </tr>
      ` : ''}
    </table>
  </div>

  <!-- Lens Information -->
  ${lensSelectionsHTML ? `
  <div class="section">
    <div class="section-title">Lens Information</div>
    <table>
      ${lensSelectionsHTML}
    </table>
  </div>
  ` : ''}

  <!-- Pricing -->
  <div class="section">
    <div class="section-title">Pricing</div>
    <table>
      <tr>
        <td style="width: 70%;"><strong>Regular Price:</strong></td>
        <td style="text-align: right;">${formatCurrency(order.regular_price)}</td>
      </tr>
      ${order.insurance_copay > 0 ? `
      <tr>
        <td><strong>Insurance Copay:</strong></td>
        <td style="text-align: right;">-${formatCurrency(order.insurance_copay)}</td>
      </tr>
      ` : ''}
      <tr>
        <td><strong>Sales Tax (2.25%):</strong></td>
        <td style="text-align: right;">${formatCurrency(order.sales_tax)}</td>
      </tr>
      ${order.you_saved > 0 ? `
      <tr>
        <td><strong>You Saved Today:</strong></td>
        <td style="text-align: right; color: #28a745; font-weight: 600;">${formatCurrency(order.you_saved)}</td>
      </tr>
      ` : ''}
      ${order.warranty_type && order.warranty_type !== 'None' ? `
      <tr>
        <td><strong>One Time Protection Warranty (${order.warranty_type}):</strong></td>
        <td style="text-align: right;">${formatCurrency(order.warranty_price)}</td>
      </tr>
      <tr>
        <td colspan="2" style="padding: 10px; background-color: #f8f9fa;">
          <div style="text-align: center; font-weight: 600; color: #495057; border-bottom: 1px solid #dee2e6; padding-bottom: 5px; margin-bottom: 5px;">
            If Warranty was Accepted - One Time Protection Fee then
          </div>
          <table style="width: 100%; border-collapse: collapse; margin-top: 5px;">
            <tr>
              <td style="border: 1px solid #333; padding: 5px; text-align: center; font-weight: 500;">Frame Copay</td>
              <td style="border: 1px solid #333; padding: 5px; text-align: center; font-weight: 600;">${formatCurrency((order.frame_price || 0) * 0.15)}</td>
            </tr>
            <tr>
              <td style="border: 1px solid #333; padding: 5px; text-align: center; font-weight: 500;">Lens Copay</td>
              <td style="border: 1px solid #333; padding: 5px; text-align: center; font-weight: 600;">${formatCurrency((order.total_lens_charges || 0) * 0.15)}</td>
            </tr>
          </table>
        </td>
      </tr>
      ` : ''}
      <tr style="background-color: #f0f0f0; font-weight: bold; font-size: 11pt;">
        <td style="border-top: 2px solid #333; padding: 6px;"><strong>Final Price:</strong></td>
        <td style="border-top: 2px solid #333; padding: 6px; text-align: right;">${formatCurrency(order.final_price)}</td>
      </tr>
    </table>
  </div>

  <!-- Other Charges -->
  ${(order.other_percent_adjustment > 0 || order.iwellness === 'yes' ||
     order.other_charge_1_price > 0 || order.other_charge_2_price > 0) ? `
  <div class="section">
    <div class="section-title">Other Charges</div>
    <table>
      ${order.other_percent_adjustment > 0 ? `
      <tr>
        <td style="width: 70%;"><strong>Other % Adjustment (${order.other_percent_adjustment}%):</strong></td>
        <td style="text-align: right;">-${formatCurrency(percentAdjustment)}</td>
      </tr>
      ` : ''}
      ${order.iwellness === 'yes' ? `
      <tr>
        <td><strong>iWellness:</strong></td>
        <td style="text-align: right;">${formatCurrency(order.iwellness_price || 39.00)}</td>
      </tr>
      ` : ''}
      ${order.other_charge_1_type && order.other_charge_1_type !== 'none' && order.other_charge_1_price > 0 ? `
      <tr>
        <td><strong>${order.other_charge_1_type === 'exam_copay' ? 'Exam Copay' :
                order.other_charge_1_type === 'cl_exam' ? 'CL Exam' : 'Other Charge'}:</strong></td>
        <td style="text-align: right;">${formatCurrency(order.other_charge_1_price)}</td>
      </tr>
      ` : ''}
      ${order.other_charge_2_type && order.other_charge_2_type !== 'none' && order.other_charge_2_price > 0 ? `
      <tr>
        <td><strong>${order.other_charge_2_type === 'exam_copay' ? 'Exam Copay' :
                order.other_charge_2_type === 'cl_exam' ? 'CL Exam' : 'Other Charge'}:</strong></td>
        <td style="text-align: right;">${formatCurrency(order.other_charge_2_price)}</td>
      </tr>
      ` : ''}
    </table>
  </div>
  ` : ''}

  <!-- Payment -->
  <div class="section">
    <div class="section-title">Payment</div>
    <table>
      <tr>
        <td style="width: 70%;"><strong>Payment Today:</strong></td>
        <td style="text-align: right;">${formatCurrency(order.payment_today)}</td>
      </tr>
      <tr>
        <td><strong>Balance Due at Pick Up:</strong></td>
        <td style="text-align: right;">${formatCurrency(order.balance_due)}</td>
      </tr>
    </table>
  </div>

  <!-- Special Notes -->
  ${order.special_notes ? `
  <div class="section">
    <div class="section-title">Special Notes</div>
    <div style="padding: 6px; background-color: #f9f9f9; border: 1px solid #ddd; min-height: 30px;">
      ${order.special_notes}
    </div>
  </div>
  ` : ''}

  ${order.verified_by ? `
  <div style="margin-top: 12px; font-size: 9pt;">
    <strong>Verified By (Initials):</strong> ${order.verified_by}
  </div>
  ` : ''}
</body>
</html>
  `;

  return html;
}

// Print order using HTML generation
async function printOrder(order, mainWindow) {
  return new Promise(async (resolve, reject) => {
    let printWindow = null;
    let tempPath = null;

    try {
      console.log('Generating print HTML for order:', order.order_number);

      // Generate HTML content
      const htmlContent = generatePrintHTML(order);

      // Create temp HTML file
      tempPath = path.join(os.tmpdir(), `print_order_${order.order_number}_${Date.now()}.html`);
      fs.writeFileSync(tempPath, htmlContent);
      console.log('Temp HTML file created at:', tempPath);

      // Create hidden window for printing
      printWindow = new BrowserWindow({
        show: false,
        webPreferences: {
          nodeIntegration: false,
          contextIsolation: true
        }
      });

      // Load the HTML file
      console.log('Loading HTML in BrowserWindow...');
      await printWindow.loadFile(tempPath);
      console.log('HTML loaded successfully');

      // Wait for content to render
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Print the content
      console.log('Initiating print...');
      printWindow.webContents.print({
        silent: false,
        printBackground: true,
        color: true,
        margins: {
          marginType: 'default'
        },
        pageSize: 'Letter'
      }, (success, errorType) => {
        console.log('Print callback - success:', success, 'errorType:', errorType);

        // Close the print window
        if (printWindow && !printWindow.isDestroyed()) {
          printWindow.close();
          printWindow = null;
        }

        // Clean up temp file
        setTimeout(() => {
          try {
            if (tempPath && fs.existsSync(tempPath)) {
              fs.unlinkSync(tempPath);
              console.log('Temp HTML file deleted');
            }
          } catch (err) {
            console.error('Error deleting temp file:', err);
          }
        }, 1000);

        if (!success) {
          reject(new Error(errorType || 'Print failed'));
        } else {
          resolve();
        }
      });

    } catch (error) {
      // Clean up on error
      console.error('Print error:', error);
      if (printWindow && !printWindow.isDestroyed()) {
        printWindow.close();
      }
      if (tempPath && fs.existsSync(tempPath)) {
        try {
          fs.unlinkSync(tempPath);
        } catch (err) {
          console.error('Error deleting temp file:', err);
        }
      }
      reject(error);
    }
  });
}

module.exports = { printOrder };
