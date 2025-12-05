import React, { useState, useEffect } from 'react';
import '../styles/OrderForm.css';

function OrderForm() {
  const [doctors, setDoctors] = useState([]);
  const [insuranceProviders, setInsuranceProviders] = useState([]);
  const [dropdownOptions, setDropdownOptions] = useState({});
  const [frames, setFrames] = useState([]);
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
    
    // Prescription Details
    od_pd: '',
    os_pd: '',
    od_seg_height: '',
    os_seg_height: '',
    od_sphere: '',
    od_cylinder: '',
    od_axis: '',
    od_prism: '',
    od_base: '',
    od_add: '',
    os_sphere: '',
    os_cylinder: '',
    os_axis: '',
    os_prism: '',
    os_base: '',
    os_add: '',
    
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
    
    // Pricing
    total_lens_charges: 0,
    regular_price: 0,
    sales_tax: 0,
    insurance_copay: 0,
    you_pay: 0,
    you_saved: 0,
    
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
    special_notes: '',
    verified_by: '',
    status: 'pending'
  });

  // Load initial data
  useEffect(() => {
    loadDoctors();
    loadInsuranceProviders();
    loadDropdownOptions();
    loadFrames();
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
    formData.insurance_copay,
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

  const loadFrames = async () => {
    const result = await window.electronAPI.getFrames();
    if (result.success) {
      setFrames(result.data);
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

  const handleIWellnessChange = (value) => {
    setFormData(prev => ({
      ...prev,
      iwellness: value,
      iwellness_price: value === 'yes' ? 39.00 : 0
    }));
  };

  const handleFrameSkuChange = async (e) => {
    const sku = e.target.value;
    setFormData(prev => ({ ...prev, frame_sku: sku }));
    
    if (sku) {
      const result = await window.electronAPI.getFrameBySku(sku);
      if (result.success && result.data) {
        setFormData(prev => ({
          ...prev,
          frame_name: result.data.name,
          frame_material: result.data.material,
          frame_price: result.data.price
        }));
      }
    }
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

    // Sum up all lens selections from JSON
    Object.values(lensSelections).forEach(selection => {
      totalLensCharges += parseFloat(selection.price) || 0;
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

    // Calculate regular price (final frame price after insurance + lenses) - round to 2 decimals
    const regularPrice = parseFloat(((parseFloat(formData.final_frame_price) || 0) + totalLensCharges).toFixed(2));

    // Auto-calculate "You Saved Today" from insurance frame savings
    const youSaved = parseFloat(((parseFloat(formData.frame_price) || 0) - (parseFloat(formData.final_frame_price) || 0)).toFixed(2));

    // Subtract insurance copay first
    const insuranceCopay = parseFloat(formData.insurance_copay) || 0;
    const afterCopay = parseFloat((regularPrice - insuranceCopay).toFixed(2));

    // Calculate sales tax (2.25%) on amount AFTER insurance copay - round to 2 decimals
    const salesTax = parseFloat((afterCopay * 0.0225).toFixed(2));

    // Calculate you pay (after copay + tax + other charges) - round to 2 decimals
    const youPay = parseFloat((afterCopay + salesTax + (parseFloat(formData.other_charges_adjustment) || 0)).toFixed(2));

    // Calculate final price (you pay + warranty) - round to 2 decimals
    const finalPrice = parseFloat((youPay + (parseFloat(formData.warranty_price) || 0)).toFixed(2));

    // Calculate balance due with new adjustments
    // Step 1: Start with final price - payment today
    let balanceDue = finalPrice - (parseFloat(formData.payment_today) || 0);

    // Step 2: Subtract percentage adjustment (percentage of balance due)
    const percentAdjustment = parseFloat((balanceDue * ((parseFloat(formData.other_percent_adjustment) || 0) / 100)).toFixed(2));
    balanceDue -= percentAdjustment;

    // Step 3: Add iWellness fee
    const iwellnessFee = parseFloat(formData.iwellness_price) || 0;
    balanceDue += iwellnessFee;

    // Step 4: Add other charge prices
    const otherCharge1Price = parseFloat(formData.other_charge_1_price) || 0;
    balanceDue += otherCharge1Price;

    const otherCharge2Price = parseFloat(formData.other_charge_2_price) || 0;
    balanceDue += otherCharge2Price;

    // Final rounding
    balanceDue = parseFloat(balanceDue.toFixed(2));

    setFormData(prev => ({
      ...prev,
      total_lens_charges: parseFloat(totalLensCharges.toFixed(2)),
      regular_price: regularPrice,
      you_saved: youSaved,
      sales_tax: salesTax,
      you_pay: youPay,
      final_price: finalPrice,
      balance_due: balanceDue
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

      // Reset form
      window.location.reload();
    } else {
      alert(`Error creating order: ${result.error}`);
    }
  };

  const handlePrint = async () => {
    // For now, just show alert - will implement after order is saved
    alert('Please save the order first before printing');
  };

  const handleSavePDF = async () => {
    // For now, just show alert - will implement after order is saved
    alert('Please save the order first before generating PDF');
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
                onChange={handleFrameSkuChange}
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
          </div>

          {/* Insurance Frame Allowance Section */}
          <div className="insurance-frame-section">
            <h4>Insurance Frame Allowance</h4>
            <div className="form-grid">
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

        {/* Lens Section - Dynamic */}
        <section className="form-section">
          <h3>Lenses</h3>
          <div className="form-grid">
            {lensCategories.map(category => (
              <div key={category.id} className="form-group">
                <label>{category.display_label}</label>
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
                <span className="price-display">
                  ${(lensSelections[category.category_key]?.price || formData[`${category.category_key}_price`] || 0).toFixed(2)}
                </span>
              </div>
            ))}
          </div>

          <div className="total-lens-charges">
            <strong>Total Lens Charges: ${formData.total_lens_charges.toFixed(2)}</strong>
          </div>
        </section>

        {/* Pricing Section */}
        <section className="form-section pricing-section">
          <h3>Pricing</h3>
          <div className="pricing-grid">
            <div className="pricing-row">
              <span>Regular Price:</span>
              <span className="price">${formData.regular_price.toFixed(2)}</span>
            </div>
            <div className="pricing-row">
              <span>Insurance Copay:</span>
              <input
                type="number"
                name="insurance_copay"
                value={formData.insurance_copay}
                onChange={handleInputChange}
                step="0.01"
                min="0"
                className="price-input"
              />
            </div>
            <div className="pricing-row">
              <span>Sales Tax (2.25%):</span>
              <span className="price">${formData.sales_tax.toFixed(2)}</span>
            </div>
            <div className="pricing-row">
              <span>You Saved Today:</span>
              <span className="price">${formData.you_saved.toFixed(2)}</span>
            </div>
            <div className="pricing-row total">
              <span><strong>You Pay:</strong></span>
              <span className="price"><strong>${formData.you_pay.toFixed(2)}</strong></span>
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
          <div className="form-grid">
            <div className="form-group">
              <label>Payment Today</label>
              <input
                type="number"
                name="payment_today"
                value={formData.payment_today}
                onChange={handleInputChange}
                step="0.01"
                min="0"
              />
            </div>
            <div className="form-group">
              <label>Balance Due at Pick Up</label>
              <input
                type="number"
                name="balance_due"
                value={formData.balance_due}
                onChange={handleInputChange}
                step="0.01"
                readOnly
                className="readonly"
              />
            </div>
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

