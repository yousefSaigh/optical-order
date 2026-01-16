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
  let hasInsurancePricing = false;

  try {
    if (order.lens_selections_json) {
      const lensSelections = JSON.parse(order.lens_selections_json);
      Object.entries(lensSelections).forEach(([category, selection]) => {
        if (selection && (selection.option_name || selection.label || selection.value) &&
            (selection.option_name !== 'None' && selection.value !== 'None')) {
          const itemLabel = selection.label || selection.option_name || selection.value;
          const regularPrice = selection.price || 0;
          // insurance_price: null means user hasn't entered a value yet, show as 0 or blank
          const insurancePrice = (selection.insurance_price !== null && selection.insurance_price !== undefined)
            ? parseFloat(selection.insurance_price) || 0
            : 0;

          // Check if any item has insurance pricing entered
          if (selection.insurance_price !== null && selection.insurance_price !== undefined) {
            hasInsurancePricing = true;
          }

          lensItems.push({
            label: category,
            value: itemLabel,
            price: regularPrice,
            insurance_price: insurancePrice
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
      { label: 'Transition', value: order.transition, price: order.transition_price },
      { label: 'Polarized', value: order.polarized, price: order.polarized_price },
      { label: 'Aspheric', value: order.aspheric, price: order.aspheric_price },
      { label: 'Edge Treatment', value: order.edge_treatment, price: order.edge_treatment_price },
      { label: 'Prism', value: order.prism, price: order.prism_price },
      { label: 'Other Add-Ons', value: order.other_option, price: order.other_option_price },
    ];

    legacyItems.forEach(item => {
      if (item.value && item.value !== 'None') {
        lensItems.push({
          ...item,
          insurance_price: item.price
        });
      }
    });
  }

  // Build lens selections HTML using table layout with insurance pricing
  let lensSelectionsHTML = '';
  if (lensItems.length > 0) {
    lensSelectionsHTML = `
      <table class="lens-table">
        <thead>
          <tr>
            <th>Category</th>
            <th>Selection</th>
            <th>Regular Price</th>
            <th>Your Price</th>
          </tr>
        </thead>
        <tbody>
          ${lensItems.map(item => `
            <tr>
              <td class="lens-category">${item.label}</td>
              <td class="lens-selection">${item.value}</td>
              <td class="lens-price">${formatCurrency(item.price)}</td>
              <td class="lens-price insurance">${formatCurrency(item.insurance_price)}</td>
            </tr>
          `).join('')}
        </tbody>
        <tfoot>
          <tr class="lens-totals">
            <td colspan="2"><strong>Total Lens Charges:</strong></td>
            <td class="lens-price"><strong>${formatCurrency(order.total_lens_charges)}</strong></td>
            <td class="lens-price insurance"><strong>${formatCurrency(order.total_lens_insurance_charges || order.total_lens_charges)}</strong></td>
          </tr>
        </tfoot>
      </table>
    `;
  }

  // Calculate insurance pricing values
  const materialCopay = order.material_copay || order.insurance_copay || 0;
  const insuranceRegularPrice = (order.final_frame_price || 0) + (order.total_lens_insurance_charges || 0);
  const insuranceAfterCopay = insuranceRegularPrice + materialCopay;
  const insuranceSalesTax = insuranceAfterCopay * 0.0225;
  const insuranceYouPay = insuranceAfterCopay + insuranceSalesTax + (order.other_charges_adjustment || 0);
  const insuranceFinalPrice = insuranceYouPay + (order.warranty_price || 0);

  // Calculate balance due values for payment section
  const paymentToday = order.payment_today || 0;
  const percentAdjustmentRate = (order.other_percent_adjustment || 0) / 100;
  const additionalCharges = (order.iwellness_price || 0) + (order.other_charge_1_price || 0) + (order.other_charge_2_price || 0);

  // NEW FORMULA: percentAdjustment is calculated on finalPrice (not finalPrice - paymentToday)
  // For display in Other Charges section
  const percentAdjustment = (order.final_price || 0) * percentAdjustmentRate;

  // Insurance: total_balance = insuranceFinalPrice - percentAdjustment + additionalCharges
  const insPercentAdj = insuranceFinalPrice * percentAdjustmentRate;
  const totalBalanceInsurance = insuranceFinalPrice - insPercentAdj + additionalCharges;
  const balanceDueInsurance = totalBalanceInsurance - paymentToday;

  // Regular (without insurance): total_balance = final_price - percentAdjustment + additionalCharges
  const regPercentAdj = (order.final_price || 0) * percentAdjustmentRate;
  const totalBalanceRegular = (order.final_price || 0) - regPercentAdj + additionalCharges;
  const balanceDueRegular = totalBalanceRegular - paymentToday;

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
      margin-bottom: 6px;
      border-bottom: 2px solid #000;
      padding-bottom: 4px;
    }

    .header h1 {
      font-size: 16pt;
      margin-bottom: 2px;
    }

    .header h2 {
      font-size: 12pt;
      font-weight: normal;
    }

    .order-info {
      display: flex;
      justify-content: space-between;
      margin-bottom: 4px;
      font-size: 9pt;
    }

    .section {
      margin-bottom: 4px;
      page-break-inside: avoid;
    }

    .section-title {
      font-size: 11pt;
      font-weight: bold;
      background-color: #f0f0f0;
      padding: 2px 6px;
      border-left: 3px solid #333;
      margin-bottom: 2px;
    }

    table {
      width: 100%;
      border-collapse: collapse;
    }

    td {
      padding: 3px 6px;
      border-bottom: 1px solid #e0e0e0;
    }

    .prescription-row {
      display: flex;
      gap: 12px;
      align-items: flex-start;
    }

    .prescription-grid {
      width: auto;
      border-collapse: collapse;
      margin: 0;
      flex-shrink: 0;
    }

    .prescription-grid td,
    .prescription-grid th {
      padding: 1px 6px;
      border: 1px solid #ddd;
      text-align: center;
      font-size: 8pt;
    }

    .prescription-grid th {
      background-color: #f0f0f0;
      font-weight: bold;
      font-size: 7pt;
    }

    .special-notes-inline {
      flex: 1;
      padding: 2px 6px;
      background-color: #f9f9f9;
      border: 1px solid #ddd;
      font-size: 8pt;
      min-height: 20px;
    }

    .special-notes-inline .notes-label {
      font-weight: bold;
      font-size: 7pt;
      color: #333;
      margin-bottom: 1px;
    }

    .pricing-table {
      width: 100%;
      border-collapse: collapse;
      margin: 0;
      font-size: 8pt;
    }

    .pricing-table th {
      background-color: #f0f0f0;
      font-weight: bold;
      padding: 2px 6px;
      border: 1px solid #ddd;
      text-align: left;
      font-size: 7pt;
    }

    .pricing-table th:nth-child(2),
    .pricing-table th:nth-child(3) {
      text-align: right;
      width: 80px;
    }

    .pricing-table td {
      padding: 1px 6px;
      border: 1px solid #ddd;
    }

    .pricing-table .pricing-label {
      font-weight: 500;
    }

    .pricing-table .pricing-value {
      text-align: right;
      width: 80px;
    }

    .pricing-table .pricing-value.insurance {
      color: #2980b9;
    }

    .pricing-table .pricing-row.total td {
      background-color: #e8f5e9;
      font-weight: bold;
    }

    .pricing-table .pricing-row.final td {
      background-color: #fff3cd;
      font-weight: bold;
      border-top: 2px solid #333;
    }

    .warranty-row {
      font-size: 7pt;
      padding: 2px 4px;
      background-color: #f8f9fa;
      text-align: center;
      color: #495057;
    }

    /* Payment Table Styles */
    .payment-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 8pt;
    }

    .payment-table th {
      background-color: #f0f0f0;
      font-weight: bold;
      padding: 2px 6px;
      border: 1px solid #ddd;
      font-size: 7pt;
    }

    .payment-table td {
      padding: 2px 6px;
      border: 1px solid #ddd;
    }

    .payment-table .balance-row td {
      background-color: #fff3cd;
      font-weight: bold;
    }

    .other-charges-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 2px 12px;
      margin: 0;
    }

    .other-charge-item {
      display: flex;
      justify-content: space-between;
      padding: 2px 4px;
      border-bottom: 1px solid #ddd;
      font-size: 8pt;
    }

    .other-charge-item .label {
      font-weight: bold;
      color: #333;
    }

    .patient-info-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 2px 12px;
      margin: 0;
    }

    .patient-info-field {
      display: flex;
      flex-direction: column;
    }

    .patient-info-field label {
      font-weight: bold;
      font-size: 8pt;
      margin-bottom: 0;
      color: #333;
    }

    .patient-info-field .value {
      font-size: 9pt;
      padding: 1px 4px;
      border-bottom: 1px solid #ddd;
    }

    .frame-info-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 2px 12px;
      margin: 0;
    }

    .frame-info-field {
      display: flex;
      flex-direction: column;
    }

    .frame-info-field label {
      font-weight: bold;
      font-size: 8pt;
      margin-bottom: 0;
      color: #333;
    }

    .frame-info-field .value {
      font-size: 9pt;
      padding: 1px 4px;
      border-bottom: 1px solid #ddd;
    }

    .frame-info-field .value.discount {
      color: #dc3545;
    }

    .lens-table {
      width: 100%;
      border-collapse: collapse;
      margin: 0;
      font-size: 8pt;
    }

    .lens-table th {
      background-color: #f0f0f0;
      font-weight: bold;
      padding: 2px 6px;
      border: 1px solid #ddd;
      text-align: left;
      font-size: 7pt;
    }

    .lens-table th:nth-child(3),
    .lens-table th:nth-child(4) {
      text-align: right;
      width: 80px;
    }

    .lens-table td {
      padding: 1px 6px;
      border: 1px solid #ddd;
    }

    .lens-table .lens-category {
      font-weight: 500;
      width: 120px;
    }

    .lens-table .lens-selection {
      /* Takes remaining space */
    }

    .lens-table .lens-price {
      text-align: right;
      width: 80px;
    }

    .lens-table .lens-price.insurance {
      color: #2980b9;
    }

    .lens-table tfoot tr {
      background-color: #f0f0f0;
      border-top: 2px solid #333;
    }

    .lens-table tfoot td {
      padding: 2px 6px;
      font-weight: bold;
    }

    .warranty-compact {
      font-size: 8pt;
      padding: 2px;
      background-color: #f8f9fa;
    }

    .warranty-compact table {
      width: 100%;
      margin-top: 2px;
    }

    .warranty-compact td {
      border: 1px solid #333;
      padding: 2px 4px;
      text-align: center;
      font-size: 8pt;
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
    <div class="patient-info-grid">
      <div class="patient-info-field">
        <label>Patient Name</label>
        <div class="value">${order.patient_name || ''}</div>
      </div>
      <div class="patient-info-field">
        <label>Date</label>
        <div class="value">${order.order_date || ''}</div>
      </div>
      <div class="patient-info-field">
        <label>Doctor</label>
        <div class="value">${order.doctor_name || ''}</div>
      </div>
      <div class="patient-info-field">
        <label>Account Number</label>
        <div class="value">${order.account_number || ''}</div>
      </div>
      <div class="patient-info-field">
        <label>Insurance</label>
        <div class="value">${order.insurance || ''}</div>
      </div>
      <div class="patient-info-field">
        <label>Sold By</label>
        <div class="value">${order.employee_name || order.sold_by || ''}</div>
      </div>
    </div>
  </div>

  <!-- Frame Information -->
  <div class="section">
    <div class="section-title">Frame Information</div>
    ${order.use_own_frame ? `
    <div style="padding: 8px 12px; background-color: #fff3cd; border: 1px solid #ffc107; border-radius: 4px; font-size: 9pt;">
      <strong>Customer Using Own Frame</strong>
      <div style="margin-top: 6px; font-size: 8pt; color: #856404;">
        While reasonable care will be exercised in handling the frame, the office assumes no liability for loss or damage to the frame.
      </div>
      ${(order.frame_material || order.frame_name || (order.material_copay && order.material_copay > 0)) ? `
      <div style="margin-top: 10px; padding-top: 8px; border-top: 1px solid #ffc107; display: flex; gap: 20px; flex-wrap: wrap; font-size: 9pt; color: #333;">
        ${order.frame_material ? `<div><strong>Material:</strong> ${order.frame_material}</div>` : ''}
        ${order.frame_name ? `<div><strong>Name/Description:</strong> ${order.frame_name}</div>` : ''}
        ${order.material_copay && order.material_copay > 0 ? `<div><strong>Material Copay:</strong> ${formatCurrency(order.material_copay)}</div>` : ''}
      </div>
      ` : ''}
    </div>
    ` : `
    <div class="frame-info-grid">
      <div class="frame-info-field">
        <label>SKU #</label>
        <div class="value">${order.frame_sku || ''}</div>
      </div>
      <div class="frame-info-field">
        <label>Material</label>
        <div class="value">${order.frame_material || ''}</div>
      </div>
      <div class="frame-info-field">
        <label>Name/Description</label>
        <div class="value">${order.frame_name || ''}</div>
      </div>
      <div class="frame-info-field">
        <label>Frame Price</label>
        <div class="value">${formatCurrency(order.frame_price)}</div>
      </div>
      ${order.frame_allowance > 0 ? `
      <div class="frame-info-field">
        <label>Frame Allowance</label>
        <div class="value discount">-${formatCurrency(order.frame_allowance)}</div>
      </div>
      ` : ''}
      ${order.frame_discount_percent > 0 ? `
      <div class="frame-info-field">
        <label>Discount</label>
        <div class="value discount">${order.frame_discount_percent.toFixed(2)}% (-${formatCurrency(((order.frame_price || 0) - (order.frame_allowance || 0)) * ((order.frame_discount_percent || 0) / 100))})</div>
      </div>
      ` : ''}
      ${(order.frame_allowance > 0 || order.frame_discount_percent > 0) ? `
      <div class="frame-info-field">
        <label>Final Frame Price</label>
        <div class="value"><strong>${formatCurrency(order.final_frame_price)}</strong></div>
      </div>
      ` : ''}
    </div>
    `}
  </div>

  <!-- Lens Information -->
  ${lensSelectionsHTML ? `
  <div class="section">
    <div class="section-title">Lens Information</div>
    ${lensSelectionsHTML}
  </div>
  ` : ''}

  <!-- Pricing -->
  <div class="section">
    <div class="section-title">Pricing</div>
    <table class="pricing-table">
      <thead>
        <tr>
          <th></th>
          <th>Regular Price</th>
          <th>Your Price</th>
        </tr>
      </thead>
      <tbody>
        <tr class="pricing-row">
          <td class="pricing-label">Total Glasses Price</td>
          <td class="pricing-value">${formatCurrency(order.regular_price)}</td>
          <td class="pricing-value insurance">${formatCurrency(insuranceRegularPrice)}</td>
        </tr>
        <tr class="pricing-row">
          <td class="pricing-label">Material Copay</td>
          <td class="pricing-value">${formatCurrency(materialCopay)}</td>
          <td class="pricing-value insurance">${formatCurrency(materialCopay)}</td>
        </tr>
        <tr class="pricing-row">
          <td class="pricing-label">Sales Tax (2.25%)</td>
          <td class="pricing-value">${formatCurrency(order.sales_tax)}</td>
          <td class="pricing-value insurance">${formatCurrency(insuranceSalesTax)}</td>
        </tr>
        <tr class="pricing-row">
          <td class="pricing-label">You Saved Today</td>
          <td class="pricing-value">${formatCurrency(order.you_saved)}</td>
          <td class="pricing-value insurance">${formatCurrency(order.you_saved)}</td>
        </tr>
        <tr class="pricing-row total">
          <td class="pricing-label"><strong>You Pay</strong></td>
          <td class="pricing-value"><strong>${formatCurrency(order.you_pay)}</strong></td>
          <td class="pricing-value insurance"><strong>${formatCurrency(insuranceYouPay)}</strong></td>
        </tr>
        ${order.warranty_type && order.warranty_type !== 'None' ? `
        <tr class="pricing-row">
          <td class="pricing-label">Warranty (${order.warranty_type})</td>
          <td class="pricing-value">${formatCurrency(order.warranty_price)}</td>
          <td class="pricing-value insurance">${formatCurrency(order.warranty_price)}</td>
        </tr>
        ` : ''}
        <tr class="pricing-row final">
          <td class="pricing-label"><strong>Final Price</strong></td>
          <td class="pricing-value"><strong>${formatCurrency(order.final_price)}</strong></td>
          <td class="pricing-value insurance"><strong>${formatCurrency(insuranceFinalPrice)}</strong></td>
        </tr>
      </tbody>
    </table>
    ${order.warranty_type && order.warranty_type !== 'None' ? `
    <div class="warranty-row">If Warranty Accepted - Copay: Frame ${formatCurrency((order.frame_price || 0) * 0.15)} | Lens ${formatCurrency((order.total_lens_charges || 0) * 0.15)}</div>
    ` : ''}
  </div>

  <!-- Other Charges -->
  ${(order.other_percent_adjustment > 0 || order.iwellness === 'yes' ||
     order.other_charge_1_price > 0 || order.other_charge_2_price > 0) ? `
  <div class="section">
    <div class="section-title">Other Charges</div>
    <div class="other-charges-grid">
      ${order.other_percent_adjustment > 0 ? `
      <div class="other-charge-item">
        <span class="label">Other % Adj (${order.other_percent_adjustment}%):</span>
        <span class="value">-${formatCurrency(percentAdjustment)}</span>
      </div>
      ` : ''}
      ${order.iwellness === 'yes' ? `
      <div class="other-charge-item">
        <span class="label">iWellness:</span>
        <span class="value">${formatCurrency(order.iwellness_price || 39.00)}</span>
      </div>
      ` : ''}
      ${order.other_charge_1_type && order.other_charge_1_type !== 'none' && order.other_charge_1_price > 0 ? `
      <div class="other-charge-item">
        <span class="label">${order.other_charge_1_type === 'exam_copay' ? 'Exam Copay' :
                order.other_charge_1_type === 'cl_exam' ? 'CL Exam' : 'Other Charge'}:</span>
        <span class="value">${formatCurrency(order.other_charge_1_price)}</span>
      </div>
      ` : ''}
      ${order.other_charge_2_type && order.other_charge_2_type !== 'none' && order.other_charge_2_price > 0 ? `
      <div class="other-charge-item">
        <span class="label">${order.other_charge_2_type === 'exam_copay' ? 'Exam Copay' :
                order.other_charge_2_type === 'cl_exam' ? 'CL Exam' : 'Other Charge'}:</span>
        <span class="value">${formatCurrency(order.other_charge_2_price)}</span>
      </div>
      ` : ''}
    </div>
  </div>
  ` : ''}

  <!-- Payment - Dual Column Layout -->
  <div class="section">
    <div class="section-title">Payment</div>
    <table class="payment-table">
      <thead>
        <tr>
          <th></th>
          <th style="text-align: right; width: 100px;">Without Insurance</th>
          <th style="text-align: right; width: 100px;">With Insurance</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>Balance:</strong></td>
          <td style="text-align: right;">${formatCurrency(totalBalanceRegular)}</td>
          <td style="text-align: right; color: #2980b9;">${formatCurrency(totalBalanceInsurance)}</td>
        </tr>
        <tr>
          <td><strong>Today's Payment:</strong></td>
          <td style="text-align: right;">${formatCurrency(paymentToday)}</td>
          <td style="text-align: right;">${formatCurrency(paymentToday)}</td>
        </tr>
        <tr class="balance-row">
          <td><strong>Balance Due at Pick Up:</strong></td>
          <td style="text-align: right;"><strong>${formatCurrency(balanceDueRegular)}</strong></td>
          <td style="text-align: right; color: #2980b9;"><strong>${formatCurrency(balanceDueInsurance)}</strong></td>
        </tr>
      </tbody>
    </table>
  </div>

  <!-- Prescription Details & Special Notes (side-by-side) -->
  <div class="section">
    <div class="section-title">Prescription Details${order.special_notes ? ' & Notes' : ''}</div>
    <div class="prescription-row">
      <table class="prescription-grid">
        <tr>
          <th></th>
          <th>OD (Right)</th>
          <th>OS (Left)</th>
          <th>Binocular PD</th>
        </tr>
        <tr>
          <th>PD</th>
          <td>${order.od_pd || ''}</td>
          <td>${order.os_pd || ''}</td>
          <td>${order.binocular_pd || ''}</td>
        </tr>
        <tr>
          <th>Seg Height</th>
          <td>${order.od_seg_height || ''}</td>
          <td>${order.os_seg_height || ''}</td>
          <td></td>
        </tr>
      </table>
      ${order.special_notes ? `
      <div class="special-notes-inline">
        <div class="notes-label">Special Notes:</div>
        <div>${order.special_notes}</div>
      </div>
      ` : ''}
    </div>
  </div>

  ${order.service_rating ? `
  <div class="section">
    <div class="section-title">Service Rating</div>
    <div style="font-size: 10pt; padding: 4px 0;">
      <strong>${order.service_rating}/10</strong>
    </div>
  </div>
  ` : ''}

  ${(order.verified_by_employee_name || order.verified_by) ? `
  <div style="margin-top: 12px; font-size: 9pt;">
    <strong>Verified By:</strong> ${order.verified_by_employee_name || order.verified_by}
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
