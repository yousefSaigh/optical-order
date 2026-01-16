const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const { app } = require('electron');
const { getSetting } = require('../database/handlers');

// Helper function to draw section headers
function drawSection(doc, title) {
  doc.font('Helvetica-Bold')
     .fontSize(11)
     .text(title, 50)
     .moveDown(0.3);
  doc.font('Helvetica')
     .fontSize(10);
}

// Helper function to build the PDF document content
function buildPDFContent(doc, order) {
  // Header - Reduced size for single-page fit
  doc.fontSize(16).text('Quality Eye Clinic Elgin', { align: 'center' });
  doc.fontSize(12).text('Optical Order', { align: 'center' });
  doc.moveDown(0.5);

  // Order Info
  doc.fontSize(10);
  doc.text(`Order Number: ${order.order_number}`, 50, doc.y);
  doc.text(`Date: ${order.order_date}`, 350, doc.y - 12);
  doc.moveDown(0.5);

  // Patient Information Section - Side-by-side layout (3 columns)
  drawSection(doc, 'Patient Information');
  doc.fontSize(9);
  const patientY = doc.y;
  // Column 1 (x=50)
  doc.font('Helvetica-Bold').text('Patient:', 50, patientY, { continued: true });
  doc.font('Helvetica').text(` ${order.patient_name}`);
  doc.font('Helvetica-Bold').text('Account #:', 50, doc.y, { continued: true });
  doc.font('Helvetica').text(` ${order.account_number || 'N/A'}`);
  // Column 2 (x=230)
  doc.font('Helvetica-Bold').text('Doctor:', 230, patientY, { continued: true });
  doc.font('Helvetica').text(` ${order.doctor_name || 'N/A'}`);
  doc.font('Helvetica-Bold').text('Insurance:', 230, patientY + 12, { continued: true });
  doc.font('Helvetica').text(` ${order.insurance || 'N/A'}`);
  // Column 3 (x=410)
  doc.font('Helvetica-Bold').text('Sold By:', 410, patientY, { continued: true });
  doc.font('Helvetica').text(` ${order.employee_name || order.sold_by || 'N/A'}`);
  doc.moveDown(1.5);

  // Frame Section - Side-by-side layout (4 columns)
  drawSection(doc, 'Frame Selection');
  doc.fontSize(9);

  // Check if customer is using their own frame
  if (order.use_own_frame) {
    doc.font('Helvetica-Bold').text('Customer Using Own Frame', 50);
    doc.moveDown(0.3);
    doc.font('Helvetica').fontSize(8);
    doc.text('While reasonable care will be exercised in handling the frame, the office assumes no liability for loss or damage to the frame.', 50);
    doc.fontSize(9);
    doc.moveDown(0.5);

    // Show frame details that are still applicable for own frame
    const ownFrameY = doc.y;
    let xPos = 50;

    if (order.frame_material) {
      doc.font('Helvetica-Bold').text('Material:', xPos, ownFrameY, { continued: true });
      doc.font('Helvetica').text(` ${order.frame_material}`);
      xPos += 150;
    }
    if (order.frame_name) {
      doc.font('Helvetica-Bold').text('Name:', xPos, ownFrameY, { continued: true });
      doc.font('Helvetica').text(` ${order.frame_name}`);
      xPos += 180;
    }
    if (order.material_copay && order.material_copay > 0) {
      doc.font('Helvetica-Bold').text('Material Copay:', xPos, ownFrameY, { continued: true });
      doc.font('Helvetica').text(` $${(order.material_copay || 0).toFixed(2)}`);
    }
  } else {
    const frameY = doc.y;
    // Row 1: SKU, Material, Name, Frame Price
    doc.font('Helvetica-Bold').text('SKU #:', 50, frameY, { continued: true });
    doc.font('Helvetica').text(` ${order.frame_sku || 'N/A'}`);
    doc.font('Helvetica-Bold').text('Material:', 170, frameY, { continued: true });
    doc.font('Helvetica').text(` ${order.frame_material || 'N/A'}`);
    doc.font('Helvetica-Bold').text('Name:', 290, frameY, { continued: true });
    doc.font('Helvetica').text(` ${order.frame_name || 'N/A'}`);
    doc.font('Helvetica-Bold').text('Frame Price:', 450, frameY, { continued: true });
    doc.font('Helvetica').text(` $${(order.frame_price || 0).toFixed(2)}`);

    // Row 2: Allowance, Discount, Final Price (if applicable)
    const hasAllowance = order.frame_allowance && order.frame_allowance > 0;
    const hasDiscount = order.frame_discount_percent && order.frame_discount_percent > 0;

    if (hasAllowance || hasDiscount) {
      doc.moveDown(0.5);
      const frameRow2Y = doc.y;
      let xPos = 50;

      if (hasAllowance) {
        doc.font('Helvetica-Bold').text('Allowance:', xPos, frameRow2Y, { continued: true });
        doc.font('Helvetica').text(` -$${(order.frame_allowance || 0).toFixed(2)}`);
        xPos += 140;
      }
      if (hasDiscount) {
        const afterAllowance = (order.frame_price || 0) - (order.frame_allowance || 0);
        const discountAmount = afterAllowance * ((order.frame_discount_percent || 0) / 100);
        doc.font('Helvetica-Bold').text('Discount:', xPos, frameRow2Y, { continued: true });
        doc.font('Helvetica').text(` ${(order.frame_discount_percent || 0).toFixed(2)}% (-$${discountAmount.toFixed(2)})`);
        xPos += 160;
      }
      doc.font('Helvetica-Bold').text('Final Price:', xPos, frameRow2Y, { continued: true });
      doc.font('Helvetica').text(` $${(order.final_frame_price || 0).toFixed(2)}`);
    }
  }

  doc.moveDown(1);

      // Lens Section - Dynamic with fallback to legacy fields
      drawSection(doc, 'Lenses');
      doc.fontSize(9);

      let lensItems = [];

      // Try to parse lens_selections_json first
      if (order.lens_selections_json) {
        try {
          const lensSelections = typeof order.lens_selections_json === 'string'
            ? JSON.parse(order.lens_selections_json)
            : order.lens_selections_json;

          // Convert JSON to display format
          Object.entries(lensSelections).forEach(([categoryKey, selection]) => {
            if (selection && selection.value) {
              // Convert category_key to display label (e.g., 'lens_design' -> 'Lens Design')
              const displayLabel = selection.label || categoryKey
                .split('_')
                .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                .join(' ');

              const regularPrice = selection.price || 0;
              // insurance_price: null means user hasn't entered a value yet, show as 0
              const insurancePrice = (selection.insurance_price !== null && selection.insurance_price !== undefined)
                ? parseFloat(selection.insurance_price) || 0
                : 0;

              lensItems.push({
                label: displayLabel,
                value: selection.value,
                price: regularPrice,
                insurance_price: insurancePrice
              });
            }
          });
        } catch (e) {
          console.error('Error parsing lens_selections_json:', e);
        }
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

      // Draw lens table header
      const lensTableY = doc.y;
      const colCategory = 50;
      const colSelection = 140;
      const colRegularPrice = 400;
      const colYourPrice = 480;

      doc.font('Helvetica-Bold').fontSize(8);
      doc.text('Category', colCategory, lensTableY);
      doc.text('Selection', colSelection, lensTableY);
      doc.text('Regular Price', colRegularPrice, lensTableY, { width: 70, align: 'right' });
      doc.text('Your Price', colYourPrice, lensTableY, { width: 70, align: 'right' });
      doc.moveDown(0.5);

      // Draw header underline
      doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
      doc.moveDown(0.3);

      // Draw lens items
      doc.font('Helvetica').fontSize(9);
      lensItems.forEach(item => {
        if (item.value && item.value !== 'None') {
          const rowY = doc.y;
          doc.text(item.label, colCategory, rowY, { width: 85 });
          doc.text(item.value, colSelection, rowY, { width: 250 });
          doc.text(`$${(item.price || 0).toFixed(2)}`, colRegularPrice, rowY, { width: 70, align: 'right' });
          doc.text(`$${(item.insurance_price || 0).toFixed(2)}`, colYourPrice, rowY, { width: 70, align: 'right' });
          doc.moveDown(0.4);
        }
      });

      // Draw totals row
      doc.moveDown(0.2);
      doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
      doc.moveDown(0.3);
      const totalsY = doc.y;
      doc.font('Helvetica-Bold');
      doc.text('Total Lens Charges:', colCategory, totalsY);
      doc.text(`$${(order.total_lens_charges || 0).toFixed(2)}`, colRegularPrice, totalsY, { width: 70, align: 'right' });
      doc.text(`$${(order.total_lens_insurance_charges || order.total_lens_charges || 0).toFixed(2)}`, colYourPrice, totalsY, { width: 70, align: 'right' });
      doc.font('Helvetica');
      doc.moveDown(0.5);

      // Pricing Section - 3-column layout (Label | Regular Price | Your Price)
      drawSection(doc, 'Pricing');
      doc.fontSize(9);

      // Calculate insurance pricing values
      const insuranceRegularPrice = (order.final_frame_price || 0) + (order.total_lens_insurance_charges || 0);
      const materialCopay = order.material_copay || order.insurance_copay || 0;
      const insuranceAfterCopay = insuranceRegularPrice + materialCopay;
      const insuranceSalesTax = insuranceAfterCopay * 0.0225;
      const insuranceYouPay = insuranceAfterCopay + insuranceSalesTax + (order.other_charges_adjustment || 0);
      const insuranceFinalPrice = insuranceYouPay + (order.warranty_price || 0);

      // Column positions for pricing
      const colLabel = 50;
      const colRegular = 400;
      const colInsurance = 480;

      // Draw header
      const pricingHeaderY = doc.y;
      doc.font('Helvetica-Bold').fontSize(8);
      doc.text('', colLabel, pricingHeaderY);
      doc.text('Regular Price', colRegular, pricingHeaderY, { width: 70, align: 'right' });
      doc.text('Your Price', colInsurance, pricingHeaderY, { width: 70, align: 'right' });
      doc.moveDown(0.5);
      doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
      doc.moveDown(0.3);

      // Pricing rows
      doc.font('Helvetica').fontSize(9);

      const pricingItems = [
        {
          label: 'Total Glasses Price',
          regular: order.regular_price || 0,
          insurance: insuranceRegularPrice
        },
        {
          label: 'Material Copay',
          regular: materialCopay,
          insurance: materialCopay
        },
        {
          label: 'Sales Tax (2.25%)',
          regular: order.sales_tax || 0,
          insurance: insuranceSalesTax
        },
        {
          label: 'You Saved Today',
          regular: order.you_saved || 0,
          insurance: order.you_saved || 0
        },
      ];

      pricingItems.forEach(item => {
        const rowY = doc.y;
        doc.text(`${item.label}:`, colLabel, rowY);
        doc.text(`$${(item.regular).toFixed(2)}`, colRegular, rowY, { width: 70, align: 'right' });
        doc.text(`$${(item.insurance).toFixed(2)}`, colInsurance, rowY, { width: 70, align: 'right' });
        doc.moveDown(0.4);
      });

      // You Pay row
      doc.moveDown(0.2);
      doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
      doc.moveDown(0.3);
      doc.font('Helvetica-Bold');
      const youPayY = doc.y;
      doc.text('You Pay:', colLabel, youPayY);
      doc.text(`$${(order.you_pay || 0).toFixed(2)}`, colRegular, youPayY, { width: 70, align: 'right' });
      doc.text(`$${(insuranceYouPay).toFixed(2)}`, colInsurance, youPayY, { width: 70, align: 'right' });
      doc.font('Helvetica');
      doc.moveDown(0.5);

      // Warranty
      if (order.warranty_type && order.warranty_type !== 'None') {
        const warrantyY = doc.y;
        doc.text(`Warranty (${order.warranty_type}):`, colLabel, warrantyY);
        doc.text(`$${(order.warranty_price || 0).toFixed(2)}`, colRegular, warrantyY, { width: 70, align: 'right' });
        doc.text(`$${(order.warranty_price || 0).toFixed(2)}`, colInsurance, warrantyY, { width: 70, align: 'right' });
        doc.moveDown(0.5);

        // Warranty Disclaimer - Replacement Copays
        doc.fontSize(8).fillColor('#666666');
        doc.text('If Warranty Accepted - Copays: ', 50, doc.y, { continued: true });
        const frameCopay = ((order.frame_price || 0) * 0.15).toFixed(2);
        const lensCopay = ((order.total_lens_charges || 0) * 0.15).toFixed(2);
        doc.text(`Frame $${frameCopay} | Lens $${lensCopay}`);
        doc.fillColor('#000000');
        doc.moveDown(0.5);
      }

      // Final Price row
      doc.font('Helvetica-Bold');
      doc.fontSize(11);
      doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
      doc.moveDown(0.3);
      const finalY = doc.y;
      doc.text('Final Price:', colLabel, finalY);
      doc.text(`$${(order.final_price || 0).toFixed(2)}`, colRegular, finalY, { width: 70, align: 'right' });
      doc.text(`$${(insuranceFinalPrice).toFixed(2)}`, colInsurance, finalY, { width: 70, align: 'right' });
      doc.font('Helvetica');
      doc.fontSize(10);
      doc.moveDown(0.5);

      // Other Charges Section
      if (order.other_percent_adjustment > 0 || order.iwellness === 'yes' || order.other_charge_1_price > 0 || order.other_charge_2_price > 0 || order.other_charges_notes) {
        drawSection(doc, 'Other Charges');

        if (order.other_percent_adjustment > 0) {
          // NEW FORMULA: percentAdjustment is calculated on final_price only (not final_price - paymentToday)
          const percentAdjustment = (order.final_price || 0) * (order.other_percent_adjustment / 100);
          doc.text(`Other % Adjustment (${order.other_percent_adjustment}%): -$${percentAdjustment.toFixed(2)}`, 50);
          doc.moveDown(0.3);
        }

        if (order.iwellness === 'yes') {
          doc.text(`iWellness: $${(order.iwellness_price || 39.00).toFixed(2)}`, 50);
          doc.moveDown(0.3);
        }

        if (order.other_charge_1_type && order.other_charge_1_type !== 'none' && order.other_charge_1_price > 0) {
          const chargeLabel = order.other_charge_1_type === 'exam_copay' ? 'Exam Copay' :
                             order.other_charge_1_type === 'cl_exam' ? 'CL Exam' : 'Other Charge';
          doc.text(`${chargeLabel}: $${(order.other_charge_1_price || 0).toFixed(2)}`, 50);
          doc.moveDown(0.3);
        }

        if (order.other_charge_2_type && order.other_charge_2_type !== 'none' && order.other_charge_2_price > 0) {
          const chargeLabel = order.other_charge_2_type === 'exam_copay' ? 'Exam Copay' :
                             order.other_charge_2_type === 'cl_exam' ? 'CL Exam' : 'Other Charge';
          doc.text(`${chargeLabel}: $${(order.other_charge_2_price || 0).toFixed(2)}`, 50);
          doc.moveDown(0.3);
        }

        if (order.other_charges_notes) {
          doc.text(`Notes: ${order.other_charges_notes}`, 50);
          doc.moveDown(0.3);
        }

        doc.moveDown(0.2);
      }

      // Payment Section - Dual column layout
      drawSection(doc, 'Payment');
      doc.fontSize(9);

      // Calculate insurance final price
      const paymentMaterialCopay = order.material_copay || order.insurance_copay || 0;
      const paymentInsuranceRegularPrice = (order.final_frame_price || 0) + (order.total_lens_insurance_charges || 0);
      const paymentInsuranceAfterCopay = paymentInsuranceRegularPrice + paymentMaterialCopay;
      const paymentInsuranceSalesTax = paymentInsuranceAfterCopay * 0.0225;
      const paymentInsuranceYouPay = paymentInsuranceAfterCopay + paymentInsuranceSalesTax + (order.other_charges_adjustment || 0);
      const paymentInsuranceFinalPrice = paymentInsuranceYouPay + (order.warranty_price || 0);

      const paymentToday = order.payment_today || 0;
      const percentAdjustmentRate = (order.other_percent_adjustment || 0) / 100;

      // Calculate additional charges (iWellness, Other Charge 1, Other Charge 2)
      const paymentAddCharges = (order.iwellness_price || 0) + (order.other_charge_1_price || 0) + (order.other_charge_2_price || 0);

      // NEW FORMULA: percentAdjustment is calculated on finalPrice (not finalPrice - paymentToday)
      // Insurance: total_balance = insuranceFinalPrice - percentAdjustment + additionalCharges
      const paymentPercentAdjInsurance = paymentInsuranceFinalPrice * percentAdjustmentRate;
      const totalBalanceInsurance = paymentInsuranceFinalPrice - paymentPercentAdjInsurance + paymentAddCharges;
      const balanceDueInsurance = totalBalanceInsurance - paymentToday;

      // Regular (without insurance): total_balance = final_price - percentAdjustment + additionalCharges
      const paymentPercentAdjRegular = (order.final_price || 0) * percentAdjustmentRate;
      const totalBalanceRegular = (order.final_price || 0) - paymentPercentAdjRegular + paymentAddCharges;
      const balanceDueRegular = totalBalanceRegular - paymentToday;

      // Column positions for payment
      const payColLabel = 50;
      const payColRegular = 400;
      const payColInsurance = 480;

      // Draw header
      const paymentHeaderY = doc.y;
      doc.font('Helvetica-Bold').fontSize(8);
      doc.text('', payColLabel, paymentHeaderY);
      doc.text('Without Insurance', payColRegular, paymentHeaderY, { width: 70, align: 'right' });
      doc.text('With Insurance', payColInsurance, paymentHeaderY, { width: 70, align: 'right' });
      doc.moveDown(0.4);
      doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
      doc.moveDown(0.3);

      doc.font('Helvetica').fontSize(9);

      // Balance row (total balance including all Other Charges)
      const balanceY = doc.y;
      doc.text('Balance:', payColLabel, balanceY);
      doc.text(`$${totalBalanceRegular.toFixed(2)}`, payColRegular, balanceY, { width: 70, align: 'right' });
      doc.text(`$${totalBalanceInsurance.toFixed(2)}`, payColInsurance, balanceY, { width: 70, align: 'right' });
      doc.moveDown(0.4);

      // Today's Payment row
      const payTodayY = doc.y;
      doc.text("Today's Payment:", payColLabel, payTodayY);
      doc.text(`$${paymentToday.toFixed(2)}`, payColRegular, payTodayY, { width: 70, align: 'right' });
      doc.text(`$${paymentToday.toFixed(2)}`, payColInsurance, payTodayY, { width: 70, align: 'right' });
      doc.moveDown(0.4);

      // Balance Due at Pick Up row - highlighted
      doc.font('Helvetica-Bold');
      doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
      doc.moveDown(0.3);
      const balanceDueY = doc.y;
      doc.text('Balance Due at Pick Up:', payColLabel, balanceDueY);
      doc.text(`$${balanceDueRegular.toFixed(2)}`, payColRegular, balanceDueY, { width: 70, align: 'right' });
      doc.text(`$${balanceDueInsurance.toFixed(2)}`, payColInsurance, balanceDueY, { width: 70, align: 'right' });
      doc.font('Helvetica');
      doc.moveDown(0.5);

      // Prescription Details Section
      drawSection(doc, 'Prescription Details');
      doc.fontSize(10);
      doc.moveDown(0.3);

      // Create simplified prescription table with 4 columns
      const tableTop = doc.y;
      const col1 = 50;   // Label
      const col2 = 150;  // OD (Right)
      const col3 = 250;  // OS (Left)
      const col4 = 350;  // Binocular PD

      doc.font('Helvetica-Bold');
      doc.text('', col1, tableTop);
      doc.text('OD (Right)', col2, tableTop);
      doc.text('OS (Left)', col3, tableTop);
      doc.text('Binocular PD', col4, tableTop);

      doc.font('Helvetica');
      doc.text('PD', col1, tableTop + 15);
      doc.text(order.od_pd || '', col2, tableTop + 15);
      doc.text(order.os_pd || '', col3, tableTop + 15);
      doc.text(order.binocular_pd || '', col4, tableTop + 15);

      doc.text('Seg Height', col1, tableTop + 30);
      doc.text(order.od_seg_height || '', col2, tableTop + 30);
      doc.text(order.os_seg_height || '', col3, tableTop + 30);
      // Seg Height row - Binocular PD cell is empty

      doc.y = tableTop + 50;

      doc.moveDown(0.5);

      // Special Notes
      if (order.special_notes) {
        drawSection(doc, 'Special Notes');
        doc.text(order.special_notes, 50);
        doc.moveDown(0.5);
      }

      // Service Rating
      if (order.service_rating) {
        drawSection(doc, 'Service Rating');
        doc.text(`${order.service_rating}/10`, 50);
        doc.moveDown(0.5);
      }

  // Footer
  const verifiedByDisplay = order.verified_by_employee_name || order.verified_by;
  if (verifiedByDisplay) {
    doc.text(`Verified By: ${verifiedByDisplay}`, 50);
  }
}

// Generate PDF and save to file
function generatePDF(order, savePath) {
  return new Promise((resolve, reject) => {
    try {
      // If no save path provided, use custom or default location
      if (!savePath) {
        // Check for custom PDF save location in settings
        const customPath = getSetting('pdf_save_location');

        let ordersDir;
        if (customPath && fs.existsSync(customPath)) {
          // Use custom path from settings
          ordersDir = customPath;
        } else {
          // Use default location
          const documentsPath = app.getPath('documents');
          ordersDir = path.join(documentsPath, 'OpticalOrders');
        }

        // Ensure directory exists
        if (!fs.existsSync(ordersDir)) {
          fs.mkdirSync(ordersDir, { recursive: true });
        }

        savePath = path.join(ordersDir, `Order_${order.order_number}.pdf`);
      }

      const doc = new PDFDocument({ margin: 50, size: 'LETTER' });
      const stream = fs.createWriteStream(savePath);

      doc.pipe(stream);

      // Build the PDF content
      buildPDFContent(doc, order);

      // End the document
      doc.end();

      stream.on('finish', () => {
        resolve(savePath);
      });

      stream.on('error', (error) => {
        reject(error);
      });

    } catch (error) {
      reject(error);
    }
  });
}

// Generate PDF buffer for printing (returns Buffer instead of saving to file)
function generatePDFBuffer(order) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50, size: 'LETTER' });
      const buffers = [];

      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        const pdfBuffer = Buffer.concat(buffers);
        resolve(pdfBuffer);
      });
      doc.on('error', reject);

      // Build the PDF content
      buildPDFContent(doc, order);

      // End the document
      doc.end();

    } catch (error) {
      reject(error);
    }
  });
}

module.exports = { generatePDF, generatePDFBuffer };

