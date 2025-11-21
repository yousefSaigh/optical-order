const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const { app } = require('electron');

function generatePDF(order, savePath) {
  return new Promise((resolve, reject) => {
    try {
      // If no save path provided, use default location
      if (!savePath) {
        const documentsPath = app.getPath('documents');
        const ordersDir = path.join(documentsPath, 'OpticalOrders');
        if (!fs.existsSync(ordersDir)) {
          fs.mkdirSync(ordersDir, { recursive: true });
        }
        savePath = path.join(ordersDir, `Order_${order.order_number}.pdf`);
      }

      const doc = new PDFDocument({ margin: 50, size: 'LETTER' });
      const stream = fs.createWriteStream(savePath);

      doc.pipe(stream);

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
      doc.text(`PD: ${order.pd || 'N/A'}`, 50);
      doc.moveDown(0.3);

      // Create prescription table
      const tableTop = doc.y;
      const col1 = 50;
      const col2 = 120;
      const col3 = 210;
      const col4 = 300;
      const col5 = 390;

      doc.font('Helvetica-Bold');
      doc.text('', col1, tableTop);
      doc.text('Sphere', col2, tableTop);
      doc.text('Cylinder', col3, tableTop);
      doc.text('Axis', col4, tableTop);
      doc.text('Add', col5, tableTop);

      doc.font('Helvetica');
      doc.text('OD', col1, tableTop + 15);
      doc.text(order.od_sphere || '', col2, tableTop + 15);
      doc.text(order.od_cylinder || '', col3, tableTop + 15);
      doc.text(order.od_axis || '', col4, tableTop + 15);
      doc.text(order.od_add || '', col5, tableTop + 15);

      doc.text('OS', col1, tableTop + 30);
      doc.text(order.os_sphere || '', col2, tableTop + 30);
      doc.text(order.os_cylinder || '', col3, tableTop + 30);
      doc.text(order.os_axis || '', col4, tableTop + 30);
      doc.text(order.os_add || '', col5, tableTop + 30);

      doc.y = tableTop + 45;
      doc.text(`Seg Height: ${order.seg_height || 'N/A'}`, 50);
      doc.moveDown(0.5);

      // Frame Section
      drawSection(doc, 'Frame Selection');
      doc.fontSize(10);
      doc.text(`Frame SKU #: ${order.frame_sku || 'N/A'}`, 50);
      doc.text(`Frame Material: ${order.frame_material || 'N/A'}`, 50);
      doc.text(`Frame Name/Description: ${order.frame_name || 'N/A'}`, 50);
      doc.text(`Formula Used: ${order.frame_formula || 'N/A'}`, 50);
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

      // Add frame price first if it exists
      if (order.frame_price && order.frame_price > 0) {
        doc.text('Frame:', 50, doc.y);
        doc.text(`$${(order.frame_price || 0).toFixed(2)}`, 480, doc.y - 12, { width: 70, align: 'right' });
        doc.moveDown(0.3);
      }

      const pricingItems = [
        { label: 'Regular Price', value: order.regular_price },
        { label: 'Sales Tax (2.25%)', value: order.sales_tax },
        { label: 'You Saved Today', value: order.you_saved },
        { label: 'Insurance Copay', value: order.insurance_copay },
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
        doc.text(`Warranty (${order.warranty_type}):`, 50, doc.y);
        doc.text(`$${(order.warranty_price || 0).toFixed(2)}`, 480, doc.y - 12, { width: 70, align: 'right' });
        doc.moveDown(0.5);
      }

      doc.font('Helvetica-Bold');
      doc.fontSize(12);
      doc.text('Final Price:', 50, doc.y);
      doc.text(`$${(order.final_price || 0).toFixed(2)}`, 480, doc.y - 14, { width: 70, align: 'right' });
      doc.font('Helvetica');
      doc.fontSize(10);
      doc.moveDown(0.5);

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

function drawSection(doc, title) {
  doc.font('Helvetica-Bold')
     .fontSize(11)
     .text(title, 50)
     .moveDown(0.3);
  doc.font('Helvetica')
     .fontSize(10);
}

module.exports = { generatePDF };

