import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import '../styles/OrderForm.css';

function OrderForm() {
  const { orderId } = useParams();
  const navigate = useNavigate();

  // Edit mode state
  const [isEditMode, setIsEditMode] = useState(false);
  const [editOrderId, setEditOrderId] = useState(null);
  const [originalOrderNumber, setOriginalOrderNumber] = useState('');

  const [doctors, setDoctors] = useState([]);
  const [insuranceProviders, setInsuranceProviders] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [dropdownOptions, setDropdownOptions] = useState({});
  const [lensCategories, setLensCategories] = useState([]);
  const [lensSelections, setLensSelections] = useState({});
  const [binocularPdManuallyEdited, setBinocularPdManuallyEdited] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    // Patient Information
    patient_name: '',
    order_date: new Date().toISOString().split('T')[0],
    doctor_id: '',
    account_number: '',
    insurance: '',
    employee_id: '',
    sold_by: '', // Keep for backward compatibility
    
    // Prescription Details (simplified - only PD and Seg Height for OD/OS)
    od_pd: '',
    os_pd: '',
    od_seg_height: '',
    os_seg_height: '',
    binocular_pd: '',

    // Frame Information
    use_own_frame: false,
    frame_sku: '',
    frame_material: '',
    frame_name: '',
    frame_formula: '',
    frame_price: '',
    frame_allowance: '',
    frame_discount_percent: '',
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
    transition: '',
    transition_price: 0,
    polarized: '',
    polarized_price: 0,
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
    material_copay: '',
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
    other_charges_adjustment: '',
    other_charges_notes: '',
    other_percent_adjustment: '',
    percent_adjustment_regular: 0,
    percent_adjustment_insurance: 0,
    iwellness: 'no',
    iwellness_price: 0,
    other_charge_1_type: 'none',
    other_charge_1_price: '',
    other_charge_2_type: 'none',
    other_charge_2_price: '',
    payment_today: '',
    // Balance fields (includes all Other Charges)
    total_balance: 0,
    total_balance_regular: 0,
    balance_due: 0,
    balance_due_regular: 0,
    payment_mode: 'with_insurance',
    special_notes: '',
    verified_by: '',
    verified_by_employee_id: '',
    service_rating: ''
  });

  // Load initial data
  useEffect(() => {
    loadDoctors();
    loadInsuranceProviders();
    loadEmployees();
    loadDropdownOptions();
    loadLensCategories();
  }, []);

  // Load order data when in edit mode
  useEffect(() => {
    if (orderId) {
      loadOrderForEdit(orderId);
    }
  }, [orderId]);

  const loadOrderForEdit = async (id) => {
    try {
      const result = await window.electronAPI.getOrderById(parseInt(id));
      if (result.success && result.data) {
        const order = result.data;
        setIsEditMode(true);
        setEditOrderId(parseInt(id));
        setOriginalOrderNumber(order.order_number);

        // Parse lens_selections_json if it exists
        let parsedLensSelections = {};
        if (order.lens_selections_json) {
          try {
            parsedLensSelections = typeof order.lens_selections_json === 'string'
              ? JSON.parse(order.lens_selections_json)
              : order.lens_selections_json;
          } catch (e) {
            console.error('Error parsing lens_selections_json:', e);
          }
        }
        setLensSelections(parsedLensSelections);

        // Populate formData with order data
        setFormData(prev => ({
          ...prev,
          patient_name: order.patient_name || '',
          order_date: order.order_date || new Date().toISOString().split('T')[0],
          doctor_id: order.doctor_id || '',
          account_number: order.account_number || '',
          insurance: order.insurance || '',
          employee_id: order.employee_id || '',
          sold_by: order.sold_by || '',
          od_pd: order.od_pd || '',
          os_pd: order.os_pd || '',
          od_seg_height: order.od_seg_height || '',
          os_seg_height: order.os_seg_height || '',
          binocular_pd: order.binocular_pd || '',
          use_own_frame: order.use_own_frame || false,
          frame_sku: order.frame_sku || '',
          frame_material: order.frame_material || '',
          frame_name: order.frame_name || '',
          frame_formula: order.frame_formula || '',
          frame_price: order.frame_price || '',
          frame_allowance: order.frame_allowance || '',
          frame_discount_percent: order.frame_discount_percent || '',
          final_frame_price: order.final_frame_price || 0,
          lens_design: order.lens_design || '',
          lens_design_price: order.lens_design_price || 0,
          lens_material: order.lens_material || '',
          lens_material_price: order.lens_material_price || 0,
          ar_coating: order.ar_coating || '',
          ar_coating_price: order.ar_coating_price || 0,
          blue_light: order.blue_light || '',
          blue_light_price: order.blue_light_price || 0,
          transition: order.transition || '',
          transition_price: order.transition_price || 0,
          polarized: order.polarized || '',
          polarized_price: order.polarized_price || 0,
          aspheric: order.aspheric || '',
          aspheric_price: order.aspheric_price || 0,
          edge_treatment: order.edge_treatment || '',
          edge_treatment_price: order.edge_treatment_price || 0,
          prism: order.prism || '',
          prism_price: order.prism_price || 0,
          other_option: order.other_option || '',
          other_option_price: order.other_option_price || 0,
          lens_selections_json: order.lens_selections_json || '',
          total_lens_charges: order.total_lens_charges || 0,
          total_lens_insurance_charges: order.total_lens_insurance_charges || 0,
          regular_price: order.regular_price || 0,
          sales_tax: order.sales_tax || 0,
          material_copay: order.material_copay || order.insurance_copay || '',
          you_pay: order.you_pay || 0,
          you_saved: order.you_saved || 0,
          insurance_regular_price: order.insurance_regular_price || 0,
          insurance_sales_tax: order.insurance_sales_tax || 0,
          insurance_you_pay: order.insurance_you_pay || 0,
          insurance_final_price: order.insurance_final_price || 0,
          warranty_type: order.warranty_type || 'None',
          warranty_price: order.warranty_price || 0,
          final_price: order.final_price || 0,
          other_charges_adjustment: order.other_charges_adjustment || '',
          other_charges_notes: order.other_charges_notes || '',
          other_percent_adjustment: order.other_percent_adjustment || '',
          percent_adjustment_regular: order.percent_adjustment_regular || 0,
          percent_adjustment_insurance: order.percent_adjustment_insurance || 0,
          iwellness: order.iwellness || 'no',
          iwellness_price: order.iwellness_price || 0,
          other_charge_1_type: order.other_charge_1_type || 'none',
          other_charge_1_price: order.other_charge_1_price || '',
          other_charge_2_type: order.other_charge_2_type || 'none',
          other_charge_2_price: order.other_charge_2_price || '',
          payment_today: order.payment_today || '',
          total_balance: order.total_balance || 0,
          total_balance_regular: order.total_balance_regular || 0,
          balance_due: order.balance_due || 0,
          balance_due_regular: order.balance_due_regular || 0,
          payment_mode: order.payment_mode || 'with_insurance',
          special_notes: order.special_notes || '',
          verified_by: order.verified_by || '',
          verified_by_employee_id: order.verified_by_employee_id || '',
          service_rating: order.service_rating || ''
        }));
      } else {
        alert('Error loading order for edit. Order not found.');
        navigate('/history');
      }
    } catch (error) {
      console.error('Error loading order for edit:', error);
      alert('Error loading order for edit: ' + error.message);
      navigate('/history');
    }
  };

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
    formData.transition_price,
    formData.polarized_price,
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

  // Auto-calculate Binocular PD when OD PD and OS PD both have numeric values
  useEffect(() => {
    // Skip auto-calculation if user has manually edited the binocular PD field
    if (binocularPdManuallyEdited) {
      return;
    }

    const odPd = parseFloat(formData.od_pd);
    const osPd = parseFloat(formData.os_pd);

    // Only calculate if both values are valid numbers
    if (!isNaN(odPd) && !isNaN(osPd) && formData.od_pd !== '' && formData.os_pd !== '') {
      const calculatedBinocularPd = odPd + osPd;
      // Round to 1 decimal place for precision
      const roundedValue = Math.round(calculatedBinocularPd * 10) / 10;
      // Convert to string, removing unnecessary decimal if whole number
      const displayValue = roundedValue % 1 === 0 ? String(Math.round(roundedValue)) : String(roundedValue);

      if (formData.binocular_pd !== displayValue) {
        setFormData(prev => ({
          ...prev,
          binocular_pd: displayValue
        }));
      }
    }
  }, [formData.od_pd, formData.os_pd, binocularPdManuallyEdited]);

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

  const loadEmployees = async () => {
    const result = await window.electronAPI.getEmployees();
    if (result.success) {
      setEmployees(result.data);
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

  // Special handler for Binocular PD to track manual edits
  const handleBinocularPdChange = (e) => {
    const { value } = e.target;

    // If user clears the field, reset manual edit flag to allow auto-calculation
    if (value === '') {
      setBinocularPdManuallyEdited(false);
    } else {
      // Mark as manually edited to prevent auto-calculation from overwriting
      setBinocularPdManuallyEdited(true);
    }

    setFormData(prev => ({
      ...prev,
      binocular_pd: value
    }));
  };

  // Special handler for "Use own frame" checkbox
  const handleUseOwnFrameChange = (e) => {
    const { checked } = e.target;
    setFormData(prev => ({
      ...prev,
      use_own_frame: checked,
      // When checked, clear and disable the frame pricing fields
      ...(checked ? {
        frame_sku: '',
        frame_price: '',
        frame_allowance: '',
        frame_discount_percent: '',
        final_frame_price: 0
      } : {})
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
      (parseFloat(formData.transition_price) || 0) +
      (parseFloat(formData.polarized_price) || 0) +
      (parseFloat(formData.aspheric_price) || 0) +
      (parseFloat(formData.edge_treatment_price) || 0) +
      (parseFloat(formData.prism_price) || 0) +
      (parseFloat(formData.other_option_price) || 0);

    // Use whichever is greater (handles both new and legacy data)
    totalLensCharges = Math.max(totalLensCharges, legacyLensTotal);

    // ===== REGULAR PRICE CALCULATIONS =====
    // Calculate regular price using original frame_price (before insurance allowances/discounts) + lenses
    const regularPrice = parseFloat(((parseFloat(formData.frame_price) || 0) + totalLensCharges).toFixed(2));

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

    // ===== BALANCE CALCULATIONS =====
    const paymentToday = parseFloat(formData.payment_today) || 0;
    const percentAdjustmentRate = (parseFloat(formData.other_percent_adjustment) || 0) / 100;

    // Calculate additional charges (iWellness, Other Charge 1, Other Charge 2)
    const iwellnessFee = parseFloat(formData.iwellness_price) || 0;
    const otherCharge1Price = parseFloat(formData.other_charge_1_price) || 0;
    const otherCharge2Price = parseFloat(formData.other_charge_2_price) || 0;
    const additionalCharges = iwellnessFee + otherCharge1Price + otherCharge2Price;

    // ===== INSURANCE (With Insurance) BALANCE =====
    // Percent adjustment is calculated on the final price (before additional charges)
    const percentAdjustmentInsurance = parseFloat((insuranceFinalPrice * percentAdjustmentRate).toFixed(2));
    // Total balance = final price - percent discount + additional charges
    const totalBalanceInsurance = parseFloat((insuranceFinalPrice - percentAdjustmentInsurance + additionalCharges).toFixed(2));
    // Balance due at pickup = total balance - today's payment
    const balanceDue = parseFloat((totalBalanceInsurance - paymentToday).toFixed(2));

    // ===== REGULAR (Without Insurance) BALANCE =====
    const percentAdjustmentRegular = parseFloat((finalPrice * percentAdjustmentRate).toFixed(2));
    const totalBalanceRegular = parseFloat((finalPrice - percentAdjustmentRegular + additionalCharges).toFixed(2));
    const balanceDueRegular = parseFloat((totalBalanceRegular - paymentToday).toFixed(2));

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
      // Percent adjustment values for display
      percent_adjustment_regular: percentAdjustmentRegular,
      percent_adjustment_insurance: percentAdjustmentInsurance,
      // Balance fields (includes all Other Charges)
      total_balance: totalBalanceInsurance,
      total_balance_regular: totalBalanceRegular,
      balance_due: balanceDue,
      balance_due_regular: balanceDueRegular
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (isEditMode) {
      // Update existing order
      const result = await window.electronAPI.updateOrder(editOrderId, formData);
      if (result.success) {
        alert(`Order updated successfully! Order Number: ${originalOrderNumber}`);
        navigate('/history');
      } else {
        alert(`Error updating order: ${result.error}`);
      }
    } else {
      // Create new order
      const result = await window.electronAPI.createOrder(formData);
      if (result.success) {
        alert(`Order created successfully! Order Number: ${result.data.order_number}`);
        // Reset form
        window.location.reload();
      } else {
        alert(`Error creating order: ${result.error}`);
      }
    }
  };

  const handlePrint = async (e) => {
    // For now, just show alert - will implement after order is saved
    // Add print functionality if user presses the print we need to handle it like a submit then print
    e.preventDefault();

    if (isEditMode) {
      // Update existing order then print
      const result = await window.electronAPI.updateOrder(editOrderId, formData);
      if (result.success) {
        let successMessage = `Order updated successfully! Order Number: ${originalOrderNumber}`;

        const printResult = await window.electronAPI.printOrder(editOrderId);
        if (printResult.success) {
          successMessage += `\n\nOrder printed successfully!`;
        } else {
          successMessage += `\n\nWarning: Order saved but printing failed: ${printResult.error}`;
        }

        alert(successMessage);
        navigate('/history');
      } else {
        alert(`Error updating order: ${result.error}`);
      }
    } else {
      // Create new order then print
      const result = await window.electronAPI.createOrder(formData);
      if (result.success) {
        const orderNumber = result.data.order_number;
        const orderId = result.data.id;

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
    }
  };

  const handleSavePDF = async (e) => {
    e.preventDefault();

    if (isEditMode) {
      // Update existing order then generate PDF
      const result = await window.electronAPI.updateOrder(editOrderId, formData);
      if (result.success) {
        let successMessage = `Order updated successfully! Order Number: ${originalOrderNumber}`;

        const pdfResult = await window.electronAPI.generatePDF(editOrderId, null);
        if (pdfResult.success) {
          successMessage += `\n\nPDF saved to: ${pdfResult.data.path}`;
        } else {
          successMessage += `\n\nWarning: Order saved but PDF generation failed: ${pdfResult.error}`;
        }

        alert(successMessage);
        navigate('/history');
      } else {
        alert(`Error updating order: ${result.error}`);
      }
    } else {
      // Create new order then generate PDF
      const result = await window.electronAPI.createOrder(formData);
      if (result.success) {
        const orderNumber = result.data.order_number;
        const orderId = result.data.id;

        let successMessage = `Order created successfully! Order Number: ${orderNumber}`;

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
    }
  };

  // Prevent Enter key from submitting form accidentally
  const handleKeyDown = (e) => {
    // Allow Enter in textareas for multi-line input
    if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA') {
      e.preventDefault();
    }
  };

  return (
    <div className="order-form-container">
      <h2>
        {isEditMode
          ? `Edit Order — ${originalOrderNumber}`
          : 'Quality Eye Clinic Elgin — Optical Order'}
      </h2>

      <form onSubmit={handleSubmit} onKeyDown={handleKeyDown} className="order-form">
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
              <label>Sold By</label>
              <select
                name="employee_id"
                value={formData.employee_id}
                onChange={handleInputChange}
              >
                <option value="">Select Employee</option>
                {employees.map(employee => (
                  <option key={employee.id} value={employee.id}>
                    {employee.name} ({employee.initials})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </section>

        {/* Frame Selection Section */}
        <section className="form-section">
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '10px', borderBottom: '2px solid #3498db', paddingBottom: '8px' }}>
            <h3 style={{ margin: 0, border: 'none' }}>Frame Selection</h3>
            <label style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '14px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                name="use_own_frame"
                checked={formData.use_own_frame}
                onChange={handleUseOwnFrameChange}
              />
              Use own frame
            </label>
          </div>
          <div className="form-grid">
            <div className="form-group">
              <label>Frame SKU #</label>
              <input
                type="text"
                name="frame_sku"
                value={formData.frame_sku}
                onChange={handleInputChange}
                placeholder="Scan or type SKU"
                disabled={formData.use_own_frame}
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
                  placeholder="0.00"
                  disabled={formData.use_own_frame}
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
                  disabled={formData.use_own_frame || !formData.frame_price || formData.frame_price === 0}
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
                  disabled={formData.use_own_frame || !formData.frame_price || formData.frame_price === 0}
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

            {/* Own Frame Disclosure Message */}
            {formData.use_own_frame && (
              <div style={{
                marginTop: '15px',
                padding: '12px',
                backgroundColor: '#fff3cd',
                border: '1px solid #ffc107',
                borderRadius: '4px',
                fontSize: '13px',
                color: '#856404'
              }}>
                <strong>Customer Using Own Frame:</strong> While reasonable care will be exercised in handling the frame, the office assumes no liability for loss or damage to the frame.
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
            {/* Header Row for % Adjustment */}
            <div className="charge-row charge-header">
              <div className="charge-label"></div>
              <div className="charge-input"></div>
              <div className="charge-amount">Regular Discount</div>
              <div className="charge-amount insurance">Your Discount</div>
            </div>
            {/* Other % Adjustment Row - with two price columns */}
            <div className="charge-row charge-row-dual">
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
                -${formData.percent_adjustment_regular.toFixed(2)}
              </div>
              <div className="charge-amount insurance">
                -${formData.percent_adjustment_insurance.toFixed(2)}
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
            {/* Balance row - shows total balance including all Other Charges */}
            <div className="payment-row">
              <span className="payment-label">Balance:</span>
              <span className="payment-value">
                ${formData.payment_mode === 'with_insurance'
                  ? formData.total_balance.toFixed(2)
                  : formData.total_balance_regular.toFixed(2)}
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
                  <th>Binocular PD</th>
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
                      placeholder="OD PD"
                    />
                  </td>
                  <td>
                    <input
                      type="text"
                      name="os_pd"
                      value={formData.os_pd}
                      onChange={handleInputChange}
                      placeholder="OS PD"
                    />
                  </td>
                  <td>
                    <input
                      type="text"
                      name="binocular_pd"
                      value={formData.binocular_pd}
                      onChange={handleBinocularPdChange}
                      placeholder="OU PD"
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
                  <td></td>
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

          {/* Service Rating */}
          <div className="form-group full-width">
            <label style={{ marginBottom: '8px', display: 'block' }}>
              On a scale of 1 to 10, 1 being terrible and 10 being amazing, how would you rate your purchase experience?
            </label>
            <div className="service-rating-container" style={{
              display: 'flex',
              justifyContent: 'flex-start',
              gap: '8px',
              marginTop: '8px'
            }}>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(rating => (
                <div key={rating} className="rating-option" style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  minWidth: '35px'
                }}>
                  <input
                    type="radio"
                    name="service_rating"
                    id={`rating_${rating}`}
                    value={rating}
                    checked={formData.service_rating === String(rating)}
                    onChange={handleInputChange}
                    style={{
                      width: '20px',
                      height: '20px',
                      cursor: 'pointer',
                      accentColor: '#4a90d9'
                    }}
                  />
                  <label
                    htmlFor={`rating_${rating}`}
                    style={{
                      marginTop: '4px',
                      fontSize: '12px',
                      cursor: 'pointer',
                      fontWeight: rating === 1 || rating === 10 ? 'bold' : 'normal'
                    }}
                  >
                    {rating}
                  </label>
                  {rating === 1 && (
                    <span style={{ fontSize: '10px', color: '#666', marginTop: '2px' }}>Terrible</span>
                  )}
                  {rating === 10 && (
                    <span style={{ fontSize: '10px', color: '#666', marginTop: '2px' }}>Amazing</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label>Verified By</label>
            <select
              name="verified_by_employee_id"
              value={formData.verified_by_employee_id}
              onChange={handleInputChange}
            >
              <option value="">Select Employee</option>
              {employees.map(employee => (
                <option key={employee.id} value={employee.id}>
                  {employee.name} ({employee.initials})
                </option>
              ))}
            </select>
          </div>
        </section>

        {/* Action Buttons */}
        <div className="form-actions">
          <button type="submit" className="btn btn-primary">
            {isEditMode ? 'Update Order' : 'Save Order'}
          </button>
          <button type="button" className="btn btn-secondary" onClick={handlePrint}>
            {isEditMode ? 'Update & Print' : 'Print'}
          </button>
          <button type="button" className="btn btn-secondary" onClick={handleSavePDF}>
            {isEditMode ? 'Update & Save PDF' : 'Save as PDF'}
          </button>
          {isEditMode ? (
            <button type="button" className="btn btn-secondary" onClick={() => navigate('/history')}>
              Cancel
            </button>
          ) : (
            <button type="button" className="btn btn-danger" onClick={() => window.location.reload()}>
              Clear Form
            </button>
          )}
        </div>
      </form>
    </div>
  );
}

export default OrderForm;

