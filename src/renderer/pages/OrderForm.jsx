import React, { useState, useEffect } from 'react';
import '../styles/OrderForm.css';

function OrderForm() {
  const [doctors, setDoctors] = useState([]);
  const [insuranceProviders, setInsuranceProviders] = useState([]);
  const [dropdownOptions, setDropdownOptions] = useState({});
  const [lensCategories, setLensCategories] = useState([]);
  const [lensSelections, setLensSelections] = useState({});

  // Form state
  const [formData, setFormData] = useState({
    // Patient Information
    patient_name: '',
    order_date: new Date().toISOString().split('T')[0],
    doctor_id: '',
    account_number: '',
    insurance: '',
    sold_by: '',
    
    // Prescription Details (simplified - only PD and Seg Height for OD/OS)
    od_pd: '',
    os_pd: '',
    od_seg_height: '',
    os_seg_height: '',

    // Frame Information
    frame_sku: '',
    frame_material: '',
    frame_name: '',
    frame_formula: '',
    frame_price: 0,
    frame_allowance: 0,
    frame_discount_percent: 0,
    final_frame_price: 0,
    
    // Lens Information
    lens_design: '',
    lens_design_price: 0,
    lens_material: '',
    lens_material_price: 0,
    ar_coating: '',
    ar_coating_price: 0,
    blue_light: '',
    blue_light_price: 0,
    transition_polarized: '',
    transition_polarized_price: 0,
    aspheric: '',
    aspheric_price: 0,
    edge_treatment: '',
    edge_treatment_price: 0,
    prism: '',
    prism_price: 0,
    other_option: '',
    other_option_price: 0,
    
    // Pricing - Regular
    total_lens_charges: 0,
    total_lens_insurance_charges: 0,
    regular_price: 0,
    sales_tax: 0,
    material_copay: 0,
    you_pay: 0,
    you_saved: 0,

    // Pricing - Insurance (Your Price)
    insurance_regular_price: 0,
    insurance_sales_tax: 0,
    insurance_you_pay: 0,
    insurance_final_price: 0,

    // Warranty
    warranty_type: 'None',
    warranty_price: 0,
    final_price: 0,
    
    // Other
    other_charges_adjustment: 0,
    other_charges_notes: '',
    other_percent_adjustment: 0,
    iwellness: 'no',
    iwellness_price: 0,
    custom_charge_1_type: 'none',
    custom_charge_1_price: 0,
    custom_charge_2_type: 'none',
    custom_charge_2_price: 0,
    payment_today: 0,
    balance_due: 0,
    balance_due_regular: 0,
    payment_mode: 'with_insurance',
    special_notes: '',
    verified_by: ''
  });

  // Load initial data
  useEffect(() => {
    loadDoctors();
    loadInsuranceProviders();
    loadDropdownOptions();
    loadLensCategories();
  }, []);

  // Calculate final frame price when frame price, allowance, or discount changes
  useEffect(() => {
    const framePrice = parseFloat(formData.frame_price) || 0;
    const allowance = parseFloat(formData.frame_allowance) || 0;
    const discountPercent = parseFloat(formData.frame_discount_percent) || 0;

    // Formula: Frame Price - Allowance - (Remaining Amount × Discount%) = Final Frame Price
    const afterAllowance = framePrice - allowance;
    const discountAmount = afterAllowance * (discountPercent / 100);
    const finalFramePrice = parseFloat((afterAllowance - discountAmount).toFixed(2));

    // Update final_frame_price if it changed
    if (formData.final_frame_price !== finalFramePrice) {
      setFormData(prev => ({
        ...prev,
        final_frame_price: finalFramePrice
      }));
    }
  }, [formData.frame_price, formData.frame_allowance, formData.frame_discount_percent]);

  // Recalculate prices whenever relevant fields change
  useEffect(() => {
    calculatePrices();
  }, [
    lensSelections,
    formData.lens_design_price,
    formData.lens_material_price,
    formData.ar_coating_price,
    formData.blue_light_price,
    formData.transition_polarized_price,
    formData.aspheric_price,
    formData.edge_treatment_price,
    formData.prism_price,
    formData.other_option_price,
    formData.frame_price,
    formData.final_frame_price,
    formData.warranty_price,
    formData.material_copay,
    formData.other_charges_adjustment,
    formData.payment_today,
    formData.other_percent_adjustment,
    formData.iwellness_price,
    formData.other_charge_1_price,
    formData.other_charge_2_price
  ]);

  const loadDoctors = async () => {
    const result = await window.electronAPI.getDoctors();
    if (result.success) {
      setDoctors(result.data);
    }
  };

  const loadInsuranceProviders = async () => {
    const result = await window.electronAPI.getInsuranceProviders();
    if (result.success) {
      setInsuranceProviders(result.data);
    }
  };

  const loadDropdownOptions = async () => {
    const result = await window.electronAPI.getAllDropdownOptions();
    if (result.success) {
      const grouped = {};
      result.data.forEach(option => {
        if (!grouped[option.category]) {
          grouped[option.category] = [];
        }
        grouped[option.category].push(option);
      });
      setDropdownOptions(grouped);
    }
  };

  const loadLensCategories = async () => {
    const result = await window.electronAPI.getActiveLensCategories();
    if (result.success) {
      setLensCategories(result.data);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleDropdownChange = (e, priceField) => {
    const { name, value } = e.target;
    // For warranty_type, look in dropdownOptions.warranty
    const categoryName = name === 'warranty_type' ? 'warranty' : name;
    const selectedOption = dropdownOptions[categoryName]?.find(opt => opt.value === value);

    setFormData(prev => ({
      ...prev,
      [name]: value,
      [priceField]: selectedOption ? selectedOption.price : 0
    }));
  };

  const handleDynamicLensChange = (categoryKey, value) => {
    const selectedOption = dropdownOptions[categoryKey]?.find(opt => opt.value === value);

    // Update lens selections JSON
    const newLensSelections = { ...lensSelections };
    if (value && selectedOption) {
      newLensSelections[categoryKey] = {
        value: value,
        price: selectedOption.price || 0,
        insurance_price: null, // Leave empty - user must manually enter Your Price
        label: selectedOption.label
      };
    } else {
      delete newLensSelections[categoryKey];
    }
    setLensSelections(newLensSelections);

    // Also update legacy fields for backward compatibility
    setFormData(prev => ({
      ...prev,
      [categoryKey]: value,
      [`${categoryKey}_price`]: selectedOption ? selectedOption.price : 0,
      lens_selections_json: JSON.stringify(newLensSelections)
    }));
  };

  const handleLensInsurancePriceChange = (categoryKey, insurancePrice) => {
    const newLensSelections = { ...lensSelections };
    if (newLensSelections[categoryKey]) {
      newLensSelections[categoryKey] = {
        ...newLensSelections[categoryKey],
        insurance_price: parseFloat(insurancePrice) || 0
      };
      setLensSelections(newLensSelections);
      setFormData(prev => ({
        ...prev,
        lens_selections_json: JSON.stringify(newLensSelections)
      }));
    }
  };

  const handleIWellnessChange = (value) => {
    setFormData(prev => ({
      ...prev,
      iwellness: value,
      iwellness_price: value === 'yes' ? 39.00 : 0
    }));
  };

  const validateFormula = (value) => {
    // Format: 100-100-100
    const pattern = /^\d{2,3}-\d{2,3}-\d{2,3}$/;
    return pattern.test(value);
  };

  const handleFormulaChange = (e) => {
    const value = e.target.value;
    setFormData(prev => ({ ...prev, frame_formula: value }));
    
    if (value && !validateFormula(value)) {
      e.target.setCustomValidity('Format must be: 100-100-100');
    } else {
      e.target.setCustomValidity('');
    }
  };

  const calculatePrices = () => {
    // Calculate total lens charges dynamically from lensSelections
    let totalLensCharges = 0;
    let totalLensInsuranceCharges = 0;

    // Sum up all lens selections from JSON
    Object.values(lensSelections).forEach(selection => {
      totalLensCharges += parseFloat(selection.price) || 0;
      // Only add insurance_price if it was manually entered (not null/undefined)
      const insurancePrice = selection.insurance_price !== null && selection.insurance_price !== undefined
        ? parseFloat(selection.insurance_price) || 0
        : 0;
      totalLensInsuranceCharges += insurancePrice;
    });

    // Also add legacy fields for backward compatibility (in case some are not in lensSelections)
    const legacyLensTotal =
      (parseFloat(formData.lens_design_price) || 0) +
      (parseFloat(formData.lens_material_price) || 0) +
      (parseFloat(formData.ar_coating_price) || 0) +
      (parseFloat(formData.blue_light_price) || 0) +
      (parseFloat(formData.transition_polarized_price) || 0) +
      (parseFloat(formData.aspheric_price) || 0) +
      (parseFloat(formData.edge_treatment_price) || 0) +
      (parseFloat(formData.prism_price) || 0) +
      (parseFloat(formData.other_option_price) || 0);

    // Use whichever is greater (handles both new and legacy data)
    totalLensCharges = Math.max(totalLensCharges, legacyLensTotal);

    // ===== REGULAR PRICE CALCULATIONS =====
    // Calculate regular price (final frame price after insurance + lenses) - round to 2 decimals
    const regularPrice = parseFloat(((parseFloat(formData.final_frame_price) || 0) + totalLensCharges).toFixed(2));

    // Auto-calculate "You Saved Today" from insurance frame savings
    const youSaved = parseFloat(((parseFloat(formData.frame_price) || 0) - (parseFloat(formData.final_frame_price) || 0)).toFixed(2));

    // Add material copay to the price
    const materialCopay = parseFloat(formData.material_copay) || 0;
    const afterCopay = parseFloat((regularPrice + materialCopay).toFixed(2));

    // Calculate sales tax (2.25%) on amount AFTER adding material copay - round to 2 decimals
    const salesTax = parseFloat((afterCopay * 0.0225).toFixed(2));

    // Calculate you pay (after copay + tax + other charges) - round to 2 decimals
    const youPay = parseFloat((afterCopay + salesTax + (parseFloat(formData.other_charges_adjustment) || 0)).toFixed(2));

    // Calculate final price (you pay + warranty) - round to 2 decimals
    const finalPrice = parseFloat((youPay + (parseFloat(formData.warranty_price) || 0)).toFixed(2));

    // ===== INSURANCE PRICE CALCULATIONS (Your Price) =====
    // Calculate insurance regular price (final frame price + insurance lens charges)
    const insuranceRegularPrice = parseFloat(((parseFloat(formData.final_frame_price) || 0) + totalLensInsuranceCharges).toFixed(2));

    // Add material copay to insurance price
    const insuranceAfterCopay = parseFloat((insuranceRegularPrice + materialCopay).toFixed(2));

    // Calculate insurance sales tax (2.25%) on insurance amount
    const insuranceSalesTax = parseFloat((insuranceAfterCopay * 0.0225).toFixed(2));

    // Calculate insurance you pay (after copay + tax + other charges)
    const insuranceYouPay = parseFloat((insuranceAfterCopay + insuranceSalesTax + (parseFloat(formData.other_charges_adjustment) || 0)).toFixed(2));

    // Calculate insurance final price (you pay + warranty)
    const insuranceFinalPrice = parseFloat((insuranceYouPay + (parseFloat(formData.warranty_price) || 0)).toFixed(2));

    // ===== BALANCE DUE CALCULATIONS =====
    const paymentToday = parseFloat(formData.payment_today) || 0;

    // Calculate other charges that apply to both
    const percentAdjustmentBase = parseFloat((insuranceFinalPrice - paymentToday) * ((parseFloat(formData.other_percent_adjustment) || 0) / 100)).toFixed(2);
    const iwellnessFee = parseFloat(formData.iwellness_price) || 0;
    const otherCharge1Price = parseFloat(formData.other_charge_1_price) || 0;
    const otherCharge2Price = parseFloat(formData.other_charge_2_price) || 0;
    const additionalCharges = iwellnessFee + otherCharge1Price + otherCharge2Price;

    // Insurance balance due (default)
    let balanceDue = insuranceFinalPrice - paymentToday;
    balanceDue -= parseFloat(percentAdjustmentBase);
    balanceDue += additionalCharges;
    balanceDue = parseFloat(balanceDue.toFixed(2));

    // Regular (without insurance) balance due
    const percentAdjustmentRegular = parseFloat((finalPrice - paymentToday) * ((parseFloat(formData.other_percent_adjustment) || 0) / 100)).toFixed(2);
    let balanceDueRegular = finalPrice - paymentToday;
    balanceDueRegular -= parseFloat(percentAdjustmentRegular);
    balanceDueRegular += additionalCharges;
    balanceDueRegular = parseFloat(balanceDueRegular.toFixed(2));

    setFormData(prev => ({
      ...prev,
      total_lens_charges: parseFloat(totalLensCharges.toFixed(2)),
      total_lens_insurance_charges: parseFloat(totalLensInsuranceCharges.toFixed(2)),
      regular_price: regularPrice,
      you_saved: youSaved,
      sales_tax: salesTax,
      you_pay: youPay,
      final_price: finalPrice,
      // Insurance pricing fields
      insurance_regular_price: insuranceRegularPrice,
      insurance_sales_tax: insuranceSalesTax,
      insurance_you_pay: insuranceYouPay,
      insurance_final_price: insuranceFinalPrice,
      balance_due: balanceDue,
      balance_due_regular: balanceDueRegular
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const result = await window.electronAPI.createOrder(formData);

    if (result.success) {
      const orderNumber = result.data.order_number;
      const orderId = result.data.id;

      // Show success message for order creation
      let successMessage = `Order created successfully! Order Number: ${orderNumber}`;

      // Automatically generate and save PDF
      const pdfResult = await window.electronAPI.generatePDF(orderId, null);

      if (pdfResult.success) {
        successMessage += `\n\nPDF saved to: ${pdfResult.data.path}`;
      } else {
        successMessage += `\n\nWarning: Order saved but PDF generation failed: ${pdfResult.error}`;
      }

      alert(successMessage);

      
    } else {
      alert(`Error creating order: ${result.error}`);
    }
  };

  const handlePrint = async (eS) => {
    // For now, just show alert - will implement after order is saved
    // Add print functionality if user presses the print we need to handle it like a submit then print
    e.preventDefault();
    const result = await window.electronAPI.createOrder(formData);

    if (result.success) {
      const orderNumber = result.data.order_number;
      const orderId = result.data.id;

      // Show success message for order creation
      let successMessage = `Order created successfully! Order Number: ${orderNumber}`;

      const printResult = await window.electronAPI.printOrder(orderId);
      if (printResult.success) {
        successMessage += `\n\nOrder printed successfully!`;
      } else {
        successMessage += `\n\nWarning: Order saved but printing failed: ${printResult.error}`;
      }

      alert(successMessage);
    } else {
      alert(`Error creating order: ${result.error}`);
    } 
  };

  const handleSavePDF = async (e) => {
   e.preventDefault();

    const result = await window.electronAPI.createOrder(formData);

    if (result.success) {
      const orderNumber = result.data.order_number;
      const orderId = result.data.id;

      // Show success message for order creation
      let successMessage = `Order created successfully! Order Number: ${orderNumber}`;

      // Automatically generate and save PDF
      const pdfResult = await window.electronAPI.generatePDF(orderId, null);

      if (pdfResult.success) {
        successMessage += `\n\nPDF saved to: ${pdfResult.data.path}`;
      } else {
        successMessage += `\n\nWarning: Order saved but PDF generation failed: ${pdfResult.error}`;
      }

      alert(successMessage);
      
    } else {
      alert(`Error creating order: ${result.error}`);
    }
  };

  return (
    <div className="order-form-container">
      <h2>Quality Eye Clinic Elgin — Optical Order</h2>
      
      <form onSubmit={handleSubmit} className="order-form">
        {/* Patient Information Section */}
        <section className="form-section">
          <h3>Patient Information</h3>
          <div className="form-grid">
            <div className="form-group">
              <label>Patient Name *</label>
              <input
                type="text"
                name="patient_name"
                value={formData.patient_name}
                onChange={handleInputChange}
                required
              />
            </div>
            
            <div className="form-group">
              <label>Date *</label>
              <input
                type="date"
                name="order_date"
                value={formData.order_date}
                onChange={handleInputChange}
                required
              />
            </div>
            
            <div className="form-group">
              <label>Doctor</label>
              <select
                name="doctor_id"
                value={formData.doctor_id}
                onChange={handleInputChange}
              >
                <option value="">Select Doctor</option>
                {doctors.map(doctor => (
                  <option key={doctor.id} value={doctor.id}>{doctor.name}</option>
                ))}
              </select>
            </div>
            
            <div className="form-group">
              <label>Account Number</label>
              <input
                type="text"
                name="account_number"
                value={formData.account_number}
                onChange={handleInputChange}
              />
            </div>
            
            <div className="form-group">
              <label>Insurance</label>
              <select
                name="insurance"
                value={formData.insurance}
                onChange={handleInputChange}
              >
                <option value="">Select Insurance Provider</option>
                {insuranceProviders.map(provider => (
                  <option key={provider.id} value={provider.name}>{provider.name}</option>
                ))}
              </select>
            </div>
            
            <div className="form-group">
              <label>Sold By (Initials)</label>
              <input
                type="text"
                name="sold_by"
                value={formData.sold_by}
                onChange={handleInputChange}
                maxLength="10"
              />
            </div>
          </div>
        </section>

        {/* Frame Selection Section */}
        <section className="form-section">
          <h3>Frame Selection</h3>
          <div className="form-grid">
            <div className="form-group">
              <label>Frame SKU #</label>
              <input
                type="text"
                name="frame_sku"
                value={formData.frame_sku}
                onChange={handleInputChange}
                placeholder="Scan or type SKU"
              />
            </div>

            <div className="form-group">
              <label>Frame Material</label>
              <select
                name="frame_material"
                value={formData.frame_material}
                onChange={handleInputChange}
              >
                <option value="">Select Material</option>
                {dropdownOptions.frame_material?.map(option => (
                  <option key={option.id} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Frame Name/Description</label>
              <input
                type="text"
                name="frame_name"
                value={formData.frame_name}
                onChange={handleInputChange}
              />
            </div>
          </div>

          {/* Frame Pricing Section */}
          <div className="insurance-frame-section">
            <div className="form-grid">
              <div className="form-group">
                <label>Frame Price</label>
                <input
                  type="number"
                  name="frame_price"
                  value={formData.frame_price}
                  onChange={handleInputChange}
                  step="0.01"
                  min="0"
                />
              </div>

              <div className="form-group">
                <label>Frame Allowance ($)</label>
                <input
                  type="number"
                  name="frame_allowance"
                  value={formData.frame_allowance}
                  onChange={handleInputChange}
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  disabled={!formData.frame_price || formData.frame_price === 0}
                />
              </div>

              <div className="form-group">
                <label>Discount (%)</label>
                <input
                  type="number"
                  name="frame_discount_percent"
                  value={formData.frame_discount_percent}
                  onChange={handleInputChange}
                  step="0.01"
                  min="0"
                  max="100"
                  placeholder="0.00"
                  disabled={!formData.frame_price || formData.frame_price === 0}
                />
              </div>

              <div className="form-group">
                <label>Material Copay ($)</label>
                <input
                  type="number"
                  name="material_copay"
                  value={formData.material_copay}
                  onChange={handleInputChange}
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                />
              </div>
            </div>

            {/* Frame Price Summary */}
            {formData.frame_price > 0 && (
              <div className="frame-price-summary">
                <h5>Frame Price Breakdown</h5>
                <div className="summary-row">
                  <span>Original Frame Price:</span>
                  <span className="price">${parseFloat(formData.frame_price || 0).toFixed(2)}</span>
                </div>
                {(formData.frame_allowance > 0 || formData.frame_discount_percent > 0) && (
                  <>
                    {formData.frame_allowance > 0 && (
                      <div className="summary-row discount">
                        <span>Insurance Allowance:</span>
                        <span className="price">-${parseFloat(formData.frame_allowance || 0).toFixed(2)}</span>
                      </div>
                    )}
                    {formData.frame_discount_percent > 0 && (
                      <div className="summary-row discount">
                        <span>Insurance Discount ({formData.frame_discount_percent}%):</span>
                        <span className="price">
                          -${(((parseFloat(formData.frame_price || 0) - parseFloat(formData.frame_allowance || 0)) * (parseFloat(formData.frame_discount_percent || 0) / 100))).toFixed(2)}
                        </span>
                      </div>
                    )}
                    <div className="summary-row savings">
                      <span>You Saved:</span>
                      <span className="price">
                        ${((parseFloat(formData.frame_price || 0) - parseFloat(formData.final_frame_price || 0))).toFixed(2)}
                      </span>
                    </div>
                  </>
                )}
                <div className="summary-row total">
                  <span><strong>Final Frame Price:</strong></span>
                  <span className="price"><strong>${parseFloat(formData.final_frame_price || 0).toFixed(2)}</strong></span>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Lens Section - Dynamic with Insurance Pricing */}
        <section className="form-section">
          <h3>Lenses</h3>
          <div className="lens-table">
            <div className="lens-table-header">
              <span className="lens-col-category">Category</span>
              <span className="lens-col-selection">Selection</span>
              <span className="lens-col-price">Regular Price</span>
              <span className="lens-total-value insurance-total">Your Price</span>
            </div>
            {lensCategories.map(category => (
              <div key={category.id} className="lens-table-row">
                <span className="lens-col-category">{category.display_label}</span>
                <div className="lens-col-selection">
                  <select
                    name={category.category_key}
                    value={formData[category.category_key] || ''}
                    onChange={(e) => handleDynamicLensChange(category.category_key, e.target.value)}
                  >
                    <option value="">Select {category.display_label}</option>
                    {dropdownOptions[category.category_key]?.map(option => (
                      <option key={option.id} value={option.value}>
                        {option.label} - ${option.price.toFixed(2)}
                      </option>
                    ))}
                  </select>
                </div>
                <span className="lens-col-price price-display">
                  ${(lensSelections[category.category_key]?.price || formData[`${category.category_key}_price`] || 0).toFixed(2)}
                </span>
                <div className="lens-col-price">
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    className="insurance-price-input"
                    value={lensSelections[category.category_key]?.insurance_price ?? ''}
                    onChange={(e) => handleLensInsurancePriceChange(category.category_key, e.target.value)}
                    placeholder="0.00"
                    disabled={!lensSelections[category.category_key]}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="total-lens-charges-grid">
            <span></span>
            <span className="lens-total-label">Totals:</span>
            <span className="lens-total-value">${formData.total_lens_charges.toFixed(2)}</span>
            <span className="lens-total-value insurance-total">${formData.total_lens_insurance_charges.toFixed(2)}</span>
          </div>
        </section>

        {/* Pricing Section */}
        <section className="form-section pricing-section">
          <h3>Pricing</h3>
          <div className="pricing-grid">
            <div className="pricing-header">
              <span></span>
              <span>Regular Price</span>
              <span>Your Price</span>
            </div>
            <div className="pricing-row">
              <span>Total Glasses Price:</span>
              <span className="price">${formData.regular_price.toFixed(2)}</span>
              <span className="price insurance">${formData.insurance_regular_price.toFixed(2)}</span>
            </div>
            <div className="pricing-row">
              <span>Material Copay:</span>
              <span className="price">${parseFloat(formData.material_copay || 0).toFixed(2)}</span>
              <span className="price insurance">${parseFloat(formData.material_copay || 0).toFixed(2)}</span>
            </div>
            <div className="pricing-row">
              <span>Sales Tax (2.25%):</span>
              <span className="price">${formData.sales_tax.toFixed(2)}</span>
              <span className="price insurance">${formData.insurance_sales_tax.toFixed(2)}</span>
            </div>
            <div className="pricing-row">
              <span>You Saved Today:</span>
              <span className="price">${formData.you_saved.toFixed(2)}</span>
              <span className="price insurance">${formData.you_saved.toFixed(2)}</span>
            </div>
            <div className="pricing-row total">
              <span><strong>You Pay:</strong></span>
              <span className="price"><strong>${formData.you_pay.toFixed(2)}</strong></span>
              <span className="price insurance"><strong>${formData.insurance_you_pay.toFixed(2)}</strong></span>
            </div>

            <div className="warranty-section">
              <label>One Time Protection Warranty:</label>
              <select
                name="warranty_type"
                value={formData.warranty_type}
                onChange={(e) => handleDropdownChange(e, 'warranty_price')}
              >
                <option value="">Select Warranty</option>
                {dropdownOptions.warranty?.map(option => (
                  <option key={option.id} value={option.value}>
                    {option.label}- {option.value} - ${parseFloat(option.price).toFixed(2)}
                  </option>
                ))}
              </select>
              {formData.warranty_price > 0 && (
                <span className="price-display">Price: ${formData.warranty_price.toFixed(2)}</span>
              )}

              {/* Warranty Disclaimer - Only show when warranty is selected */}
              {formData.warranty_type && formData.warranty_type !== 'None' && formData.warranty_type !== '' && (
                <div className="warranty-disclaimer">
                  <div className="disclaimer-header">If Warranty was Accepted - One Time Protection Fee at the time of replacement</div>
                  <table className="copay-table">
                    <tbody>
                      <tr>
                        <td className="copay-label">Frame Copay</td>
                        <td className="copay-amount">${((parseFloat(formData.frame_price) || 0) * 0.15).toFixed(2)}</td>
                      </tr>
                      <tr>
                        <td className="copay-label">Lens Copay</td>
                        <td className="copay-amount">${((parseFloat(formData.total_lens_charges) || 0) * 0.15).toFixed(2)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="pricing-row final">
              <span><strong>Final Price:</strong></span>
              <span className="price final-price"><strong>${formData.final_price.toFixed(2)}</strong></span>
              <span className="price final-price insurance"><strong>${formData.insurance_final_price.toFixed(2)}</strong></span>
            </div>
          </div>
        </section>

        {/* Other Charges Section */}
        <section className="form-section">
          <h3>Other Charges</h3>
          <div className="other-charges-grid">
            {/* Other % Adjustment Row */}
            <div className="charge-row">
              <div className="charge-label">Other % Adjustment</div>
              <div className="charge-input">
                <input
                  type="number"
                  name="other_percent_adjustment"
                  value={formData.other_percent_adjustment}
                  onChange={handleInputChange}
                  step="0.01"
                  min="0"
                  placeholder="0"
                  className="percent-input"
                />
                <span className="percent-symbol">%</span>
              </div>
              <div className="charge-amount">
                -${parseFloat((formData.final_price - (parseFloat(formData.payment_today) || 0)) * ((parseFloat(formData.other_percent_adjustment) || 0) / 100)).toFixed(2)}
              </div>
            </div>

            {/* iWellness Row */}
            <div className="charge-row">
              <div className="charge-label">iWellness</div>
              <div className="charge-input">
                <select
                  name="iwellness"
                  value={formData.iwellness}
                  onChange={(e) => handleIWellnessChange(e.target.value)}
                  className="iwellness-select"
                >
                  <option value="no">No</option>
                  <option value="yes">Yes</option>
                </select>
              </div>
              <div className="charge-amount">
                ${formData.iwellness === 'yes' ? '39.00' : '0.00'}
              </div>
            </div>

            {/* Other Charge 1 Row */}
            <div className="charge-row">
              <div className="charge-label">Other Charge</div>
              <div className="charge-input">
                <select
                  name="other_charge_1_type"
                  value={formData.other_charge_1_type}
                  onChange={handleInputChange}
                  className="iwellness-select"
                >
                  <option value="none">None</option>
                  <option value="exam_copay">Exam Copay</option>
                  <option value="cl_exam">CL Exam</option>
                </select>
              </div>
              <div className="charge-amount">
                <input
                  type="number"
                  name="other_charge_1_price"
                  value={formData.other_charge_1_price}
                  onChange={handleInputChange}
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  className="price-input-small"
                />
              </div>
            </div>

            {/* Other Charge 2 Row */}
            <div className="charge-row">
              <div className="charge-label">Other Charge</div>
              <div className="charge-input">
                <select
                  name="other_charge_2_type"
                  value={formData.other_charge_2_type}
                  onChange={handleInputChange}
                  className="iwellness-select"
                >
                  <option value="none">None</option>
                  <option value="exam_copay">Exam Copay</option>
                  <option value="cl_exam">CL Exam</option>
                </select>
              </div>
              <div className="charge-amount">
                <input
                  type="number"
                  name="other_charge_2_price"
                  value={formData.other_charge_2_price}
                  onChange={handleInputChange}
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  className="price-input-small"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Payment Section */}
        <section className="form-section">
          <h3>Payment</h3>

          {/* Insurance Mode Toggle */}
          <div className="payment-mode-toggle">
            <label className="toggle-label">Pricing Mode:</label>
            <div className="toggle-options">
              <label className={`toggle-option ${formData.payment_mode === 'without_insurance' ? 'active' : ''}`}>
                <input
                  type="radio"
                  name="payment_mode"
                  value="without_insurance"
                  checked={formData.payment_mode === 'without_insurance'}
                  onChange={handleInputChange}
                />
                <span>Without Insurance</span>
              </label>
              <label className={`toggle-option ${formData.payment_mode === 'with_insurance' ? 'active' : ''}`}>
                <input
                  type="radio"
                  name="payment_mode"
                  value="with_insurance"
                  checked={formData.payment_mode === 'with_insurance'}
                  onChange={handleInputChange}
                />
                <span>With Insurance </span>
              </label>
            </div>
          </div>

          <div className="payment-grid">
            {/* Balance row - shows starting balance before today's payment */}
            <div className="payment-row">
              <span className="payment-label">Balance:</span>
              <span className="payment-value">
                ${formData.payment_mode === 'with_insurance'
                  ? formData.insurance_final_price.toFixed(2)
                  : formData.final_price.toFixed(2)}
              </span>
            </div>
            {/* Today's Payment input */}
            <div className="payment-row">
              <span className="payment-label">Today's Payment:</span>
              <div className="payment-input">
                <span className="currency-prefix">$</span>
                <input
                  type="number"
                  name="payment_today"
                  value={formData.payment_today}
                  onChange={handleInputChange}
                  step="0.01"
                  min="0"
                />
              </div>
            </div>
            {/* Balance Due at Pick Up - highlighted */}
            <div className="payment-row highlight">
              <span className="payment-label">Balance Due at Pick Up:</span>
              <span className="payment-value">
                ${formData.payment_mode === 'with_insurance'
                  ? formData.balance_due.toFixed(2)
                  : formData.balance_due_regular.toFixed(2)}
              </span>
            </div>
          </div>
        </section>

        {/* Prescription Details Section */}
        <section className="form-section">
          <h3>Prescription Details</h3>

          <div className="prescription-table">
            <table>
              <thead>
                <tr>
                  <th></th>
                  <th>OD (Right)</th>
                  <th>OS (Left)</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><strong>PD</strong></td>
                  <td>
                    <input
                      type="text"
                      name="od_pd"
                      value={formData.od_pd}
                      onChange={handleInputChange}
                      placeholder="e.g., 32"
                    />
                  </td>
                  <td>
                    <input
                      type="text"
                      name="os_pd"
                      value={formData.os_pd}
                      onChange={handleInputChange}
                      placeholder="e.g., 31"
                    />
                  </td>
                </tr>
                <tr>
                  <td><strong>Seg Height</strong></td>
                  <td>
                    <input
                      type="text"
                      name="od_seg_height"
                      value={formData.od_seg_height}
                      onChange={handleInputChange}
                      placeholder="e.g., 18mm"
                    />
                  </td>
                  <td>
                    <input
                      type="text"
                      name="os_seg_height"
                      value={formData.os_seg_height}
                      onChange={handleInputChange}
                      placeholder="e.g., 18mm"
                    />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Special Notes Section */}
        <section className="form-section">
          <h3>Special Notes</h3>
          <div className="form-group full-width">
            <textarea
              name="special_notes"
              value={formData.special_notes}
              onChange={handleInputChange}
              rows="3"
              placeholder="Enter any special notes or instructions..."
            />
          </div>

          <div className="form-group">
            <label>Verified By (Initials)</label>
            <input
              type="text"
              name="verified_by"
              value={formData.verified_by}
              onChange={handleInputChange}
              maxLength="10"
            />
          </div>
        </section>

        {/* Action Buttons */}
        <div className="form-actions">
          <button type="submit" className="btn btn-primary">Save Order</button>
          <button type="button" className="btn btn-secondary" onClick={handlePrint}>Print</button>
          <button type="button" className="btn btn-secondary" onClick={handleSavePDF}>Save as PDF</button>
          <button type="button" className="btn btn-danger" onClick={() => window.location.reload()}>Clear Form</button>
        </div>
      </form>
    </div>
  );
}

export default OrderForm;

