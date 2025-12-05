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

  // Patient Information Section
  drawSection(doc, 'Patient Information');
  doc.fontSize(10);
  doc.text(`Patient: ${order.patient_name}`, 50);
  doc.text(`Account #: ${order.account_number || 'N/A'}`, 50);
  doc.text(`Doctor: ${order.doctor_name || 'N/A'}`, 50);
  doc.text(`Insurance: ${order.insurance || 'N/A'}`, 50);
  doc.text(`Sold By: ${order.sold_by || 'N/A'}`, 50);
  doc.moveDown(0.5);

      // Prescription Details Section
      drawSection(doc, 'Prescription Details');
      doc.fontSize(10);
      doc.moveDown(0.3);

      // Create simplified prescription table with 3 columns
      const tableTop = doc.y;
      const col1 = 50;   // Label
      const col2 = 150;  // OD (Right)
      const col3 = 250;  // OS (Left)

      doc.font('Helvetica-Bold');
      doc.text('', col1, tableTop);
      doc.text('OD (Right)', col2, tableTop);
      doc.text('OS (Left)', col3, tableTop);

      doc.font('Helvetica');
      doc.text('PD', col1, tableTop + 15);
      doc.text(order.od_pd || '', col2, tableTop + 15);
      doc.text(order.os_pd || '', col3, tableTop + 15);

      doc.text('Seg Height', col1, tableTop + 30);
      doc.text(order.od_seg_height || '', col2, tableTop + 30);
      doc.text(order.os_seg_height || '', col3, tableTop + 30);

      doc.y = tableTop + 50;
      doc.moveDown(0.5);

      // Frame Section
      drawSection(doc, 'Frame Selection');
      doc.fontSize(10);
      doc.text(`Frame SKU #: ${order.frame_sku || 'N/A'}`, 50);
      doc.text(`Frame Material: ${order.frame_material || 'N/A'}`, 50);
      doc.text(`Frame Name/Description: ${order.frame_name || 'N/A'}`, 50);
      doc.text(`Frame Price: $${(order.frame_price || 0).toFixed(2)}`, 50);

      // Show insurance frame allowance if applicable
      if ((order.frame_allowance && order.frame_allowance > 0) || (order.frame_discount_percent && order.frame_discount_percent > 0)) {
        doc.moveDown(0.3);
        doc.fontSize(9).fillColor('#666666');
        doc.text('Insurance Frame Allowance:', 50);
        doc.fontSize(10).fillColor('#000000');

        if (order.frame_allowance && order.frame_allowance > 0) {
          doc.text(`  Frame Allowance: -$${(order.frame_allowance || 0).toFixed(2)}`, 50);
        }
        if (order.frame_discount_percent && order.frame_discount_percent > 0) {
          const afterAllowance = (order.frame_price || 0) - (order.frame_allowance || 0);
          const discountAmount = afterAllowance * ((order.frame_discount_percent || 0) / 100);
          doc.text(`  Discount: ${(order.frame_discount_percent || 0).toFixed(2)}% (-$${discountAmount.toFixed(2)})`, 50);
        }
        doc.text(`  Final Frame Price: $${(order.final_frame_price || 0).toFixed(2)}`, 50);
      }

      doc.moveDown(0.5);

      // Lens Section - Dynamic with fallback to legacy fields
      drawSection(doc, 'Lenses');
      doc.fontSize(10);

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

              lensItems.push({
                label: displayLabel,
                value: selection.value,
                price: selection.price || 0
              });
            }
          });
        } catch (e) {
          console.error('Error parsing lens_selections_json:', e);
        }
      }

      // Fallback to legacy fields if no JSON data
      if (lensItems.length === 0) {
        lensItems = [
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
      }

      lensItems.forEach(item => {
        if (item.value && item.value !== 'None') {
          doc.text(`${item.label}: ${item.value}`, 50, doc.y);
          doc.text(`$${(item.price || 0).toFixed(2)}`, 480, doc.y - 12, { width: 70, align: 'right' });
          doc.moveDown(0.3);
        }
      });

      doc.moveDown(0.3);
      doc.font('Helvetica-Bold');
      doc.text('Total Lens Charges:', 50, doc.y);
      doc.text(`$${(order.total_lens_charges || 0).toFixed(2)}`, 480, doc.y - 12, { width: 70, align: 'right' });
      doc.font('Helvetica');
      doc.moveDown(0.5);

      // Pricing Section
      drawSection(doc, 'Pricing');
      doc.fontSize(10);

      // Add final frame price (after insurance) if it exists
      if (order.final_frame_price && order.final_frame_price > 0) {
        doc.text('Frame (after insurance):', 50, doc.y);
        doc.text(`$${(order.final_frame_price || 0).toFixed(2)}`, 480, doc.y - 12, { width: 70, align: 'right' });
        doc.moveDown(0.3);
      }

      const pricingItems = [
        { label: 'Regular Price', value: order.regular_price },
        { label: 'Insurance Copay', value: order.insurance_copay },
        { label: 'Sales Tax (2.25%)', value: order.sales_tax },
        { label: 'You Saved Today', value: order.you_saved },
      ];

      pricingItems.forEach(item => {
        doc.text(`${item.label}:`, 50, doc.y);
        doc.text(`$${(item.value || 0).toFixed(2)}`, 480, doc.y - 12, { width: 70, align: 'right' });
        doc.moveDown(0.3);
      });

      doc.moveDown(0.2);
      doc.text('You Pay:', 50, doc.y);
      doc.text(`$${(order.you_pay || 0).toFixed(2)}`, 480, doc.y - 12, { width: 70, align: 'right' });
      doc.moveDown(0.5);

      // Warranty
      if (order.warranty_type && order.warranty_type !== 'None') {
        doc.text(`One Time Protection Warranty (${order.warranty_type}):`, 50, doc.y);
        doc.text(`$${(order.warranty_price || 0).toFixed(2)}`, 480, doc.y - 12, { width: 70, align: 'right' });
        doc.moveDown(0.5);

        // Warranty Disclaimer - Replacement Copays
        doc.fontSize(9).fillColor('#666666');
        doc.text('If Warranty was Accepted - One Time Protection Fee then', 50, doc.y);
        doc.moveDown(0.3);

        // Draw copay table
        const frameCopay = ((order.frame_price || 0) * 0.15).toFixed(2);
        const lensCopay = ((order.total_lens_charges || 0) * 0.15).toFixed(2);

        doc.fontSize(10).fillColor('#000000');
        doc.rect(50, doc.y, 250, 20).stroke();
        doc.rect(300, doc.y, 100, 20).stroke();
        doc.text('Frame Copay', 55, doc.y + 5, { width: 240 });
        doc.text(`$${frameCopay}`, 305, doc.y - 15, { width: 90, align: 'center' });
        doc.moveDown(1.2);

        doc.rect(50, doc.y, 250, 20).stroke();
        doc.rect(300, doc.y, 100, 20).stroke();
        doc.text('Lens Copay', 55, doc.y + 5, { width: 240 });
        doc.text(`$${lensCopay}`, 305, doc.y - 15, { width: 90, align: 'center' });
        doc.moveDown(1.5);
      }

      doc.font('Helvetica-Bold');
      doc.fontSize(12);
      doc.text('Final Price:', 50, doc.y);
      doc.text(`$${(order.final_price || 0).toFixed(2)}`, 480, doc.y - 14, { width: 70, align: 'right' });
      doc.font('Helvetica');
      doc.fontSize(10);
      doc.moveDown(0.5);

      // Other Charges Section
      if (order.other_percent_adjustment > 0 || order.iwellness === 'yes' || order.other_charge_1_price > 0 || order.other_charge_2_price > 0 || order.other_charges_notes) {
        drawSection(doc, 'Other Charges');

        if (order.other_percent_adjustment > 0) {
          const baseAmount = order.final_price - (order.payment_today || 0);
          const percentAdjustment = baseAmount * (order.other_percent_adjustment / 100);
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

      // Payment Section
      drawSection(doc, 'Payment');
      doc.text(`Payment Today: $${(order.payment_today || 0).toFixed(2)}`, 50);
      doc.text(`Balance Due at Pick Up: $${(order.balance_due || 0).toFixed(2)}`, 50);
      doc.moveDown(0.5);

      // Special Notes
      if (order.special_notes) {
        drawSection(doc, 'Special Notes');
        doc.text(order.special_notes, 50);
        doc.moveDown(0.5);
      }

  // Footer
  if (order.verified_by) {
    doc.text(`Verified By (Initials): ${order.verified_by}`, 50);
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

