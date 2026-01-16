import React, { useState, useEffect } from 'react';
import '../styles/OrderHistory.css';

function OrderHistory() {
  const [orders, setOrders] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    const result = await window.electronAPI.getOrders(100, 0);
    if (result.success) {
      setOrders(result.data);
    }
  };

  const handleSearch = async () => {
    if (searchTerm.trim()) {
      const result = await window.electronAPI.searchOrders(searchTerm);
      if (result.success) {
        setOrders(result.data);
      }
    } else {
      loadOrders();
    }
  };

  const handleViewDetails = async (orderId) => {
    const result = await window.electronAPI.getOrderById(orderId);
    if (result.success) {
      setSelectedOrder(result.data);
      setShowDetails(true);
    }
  };

  const handlePrint = async (orderId) => {
    const result = await window.electronAPI.printOrder(orderId);
    if (result.success) {
      alert('Order sent to printer');
    } else {
      alert(`Error printing: ${result.error}`);
    }
  };

  const handleGeneratePDF = async (orderId) => {
    const result = await window.electronAPI.generatePDF(orderId, null);
    if (result.success) {
      alert(`PDF saved to: ${result.data.path}`);
    } else {
      alert(`Error generating PDF: ${result.error}`);
    }
  };

  const handleDelete = async (orderId) => {
    if (window.confirm('Are you sure you want to delete this order?')) {
      const result = await window.electronAPI.deleteOrder(orderId);
      if (result.success) {
        alert('Order deleted successfully');
        loadOrders();
      } else {
        alert(`Error deleting order: ${result.error}`);
      }
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatCurrency = (amount) => {
    return `$${(amount || 0).toFixed(2)}`;
  };

  // Calculate the display price based on the saved payment mode
  const getDisplayPrice = (order) => {
    const isWithInsurance = (order.payment_mode || 'with_insurance') === 'with_insurance';

    if (isWithInsurance) {
      // Calculate insurance final price
      const materialCopay = order.material_copay || order.insurance_copay || 0;
      const insuranceRegularPrice = (order.final_frame_price || 0) + (order.total_lens_insurance_charges || 0);
      const insuranceAfterCopay = insuranceRegularPrice + materialCopay;
      const insuranceSalesTax = insuranceAfterCopay * 0.0225;
      const insuranceYouPay = insuranceAfterCopay + insuranceSalesTax + (order.other_charges_adjustment || 0);
      const insuranceFinalPrice = insuranceYouPay + (order.warranty_price || 0);
      return insuranceFinalPrice;
    } else {
      return order.final_price || 0;
    }
  };

  const getLensSelections = (order) => {
    const lensItems = [];

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
            const displayLabel = categoryKey
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

        return lensItems;
      } catch (e) {
        console.error('Error parsing lens_selections_json:', e);
      }
    }

    // Fallback to legacy fields if no JSON data
    const legacyItems = [
      { label: 'Lens Design', value: order.lens_design, price: order.lens_design_price },
      { label: 'Lens Material', value: order.lens_material, price: order.lens_material_price },
      { label: 'AR Coating', value: order.ar_coating, price: order.ar_coating_price },
      { label: 'Blue Light', value: order.blue_light, price: order.blue_light_price },
      { label: 'Transition', value: order.transition, price: order.transition_price },
      { label: 'Polarized', value: order.polarized, price: order.polarized_price },
      { label: 'Aspheric', value: order.aspheric, price: order.aspheric_price },
      { label: 'Edge Treatment', value: order.edge_treatment, price: order.edge_treatment_price },
      { label: 'Prism', value: order.prism, price: order.prism_price },
      { label: 'Other Add-Ons', value: order.other_option, price: order.other_option_price },
    ];

    return legacyItems.filter(item => item.value && item.value !== 'None').map(item => ({
      ...item,
      insurance_price: item.price
    }));
  };

  return (
    <div className="order-history-container">
      <h2>Order History</h2>

      {/* Search Bar */}
      <div className="search-bar">
        <input
          type="text"
          placeholder="Search by patient name, order number, or account number..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
        />
        <button onClick={handleSearch} className="btn btn-primary">Search</button>
        <button onClick={loadOrders} className="btn btn-secondary">Show All</button>
      </div>

      {/* Orders Table */}
      <div className="orders-table-container">
        <table className="orders-table">
          <thead>
            <tr>
              <th>Order #</th>
              <th>Date</th>
              <th>Patient Name</th>
              <th>Doctor</th>
              <th>Final Price</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {orders.length === 0 ? (
              <tr>
                <td colSpan="7" className="no-data">No orders found</td>
              </tr>
            ) : (
              orders.map(order => (
                <tr key={order.id}>
                  <td>{order.order_number}</td>
                  <td>{formatDate(order.order_date)}</td>
                  <td>{order.patient_name}</td>
                  <td>{order.doctor_name || 'N/A'}</td>
                  <td>{formatCurrency(getDisplayPrice(order))}</td>
                  <td className="actions">
                    <button
                      onClick={() => handleViewDetails(order.id)}
                      className="btn-icon"
                      title="View Details"
                    >
                      👁️
                    </button>
                    <button
                      onClick={() => handlePrint(order.id)}
                      className="btn-icon"
                      title="Print"
                    >
                      🖨️
                    </button>
                    <button
                      onClick={() => handleGeneratePDF(order.id)}
                      className="btn-icon"
                      title="Save as PDF"
                    >
                      📄
                    </button>
                    <button
                      onClick={() => handleDelete(order.id)}
                      className="btn-icon btn-danger"
                      title="Delete"
                    >
                      🗑️
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Order Details Modal */}
      {showDetails && selectedOrder && (
      <div className="modal-overlay" onClick={() => setShowDetails(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Order Details - {selectedOrder.order_number}</h3>
              <button className="close-btn" onClick={() => setShowDetails(false)}>×</button>
            </div>
            
            <div className="modal-body">
              {/* Patient Information */}
              <section className="detail-section">
                <h4>Patient Information</h4>
                <div className="detail-grid">
                  <div><strong>Patient:</strong> {selectedOrder.patient_name}</div>
                  <div><strong>Date:</strong> {formatDate(selectedOrder.order_date)}</div>
                  <div><strong>Doctor:</strong> {selectedOrder.doctor_name || 'N/A'}</div>
                  <div><strong>Account #:</strong> {selectedOrder.account_number || 'N/A'}</div>
                  <div><strong>Insurance:</strong> {selectedOrder.insurance || 'N/A'}</div>
                  <div><strong>Sold By:</strong> {selectedOrder.employee_name || selectedOrder.sold_by || 'N/A'}</div>
                </div>
              </section>

              {/* Frame */}
              <section className="detail-section">
                <h4>Frame</h4>
                {selectedOrder.use_own_frame ? (
                  <div style={{
                    padding: '12px',
                    backgroundColor: '#fff3cd',
                    border: '1px solid #ffc107',
                    borderRadius: '4px',
                    fontSize: '14px',
                    color: '#856404'
                  }}>
                    <strong>Customer Using Own Frame</strong>
                    <div style={{ marginTop: '8px', fontSize: '12px' }}>
                      While reasonable care will be exercised in handling the frame, the office assumes no liability for loss or damage to the frame.
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="detail-grid">
                      <div><strong>SKU:</strong> {selectedOrder.frame_sku || 'N/A'}</div>
                      <div><strong>Material:</strong> {selectedOrder.frame_material || 'N/A'}</div>
                      <div><strong>Name:</strong> {selectedOrder.frame_name || 'N/A'}</div>
                      <div><strong>Frame Price:</strong> ${(selectedOrder.frame_price || 0).toFixed(2)}</div>
                    </div>

                    {/* Insurance Frame Allowance */}
                    {((selectedOrder.frame_allowance && selectedOrder.frame_allowance > 0) ||
                      (selectedOrder.frame_discount_percent && selectedOrder.frame_discount_percent > 0)) && (
                      <div style={{ marginTop: '1rem', padding: '0.75rem', backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
                        <div style={{ fontSize: '0.9rem', color: '#666', marginBottom: '0.5rem' }}>
                          <strong>Insurance Frame Allowance:</strong>
                        </div>
                        {selectedOrder.frame_allowance > 0 && (
                          <div style={{ paddingLeft: '1rem', color: '#dc3545' }}>
                            Allowance: -${(selectedOrder.frame_allowance || 0).toFixed(2)}
                          </div>
                        )}
                        {selectedOrder.frame_discount_percent > 0 && (
                          <div style={{ paddingLeft: '1rem', color: '#dc3545' }}>
                            Discount: {(selectedOrder.frame_discount_percent || 0).toFixed(2)}%
                            (-${(((selectedOrder.frame_price || 0) - (selectedOrder.frame_allowance || 0)) * ((selectedOrder.frame_discount_percent || 0) / 100)).toFixed(2)})
                          </div>
                        )}
                        <div style={{ paddingLeft: '1rem', marginTop: '0.5rem', fontWeight: 'bold' }}>
                          Final Frame Price: ${(selectedOrder.final_frame_price || 0).toFixed(2)}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </section>

              {/* Lenses - Dynamic with Insurance Pricing */}
              <section className="detail-section">
                <h4>Lenses</h4>
                <div className="lens-table-view">
                  <div className="lens-table-header-row">
                    <span className="lens-col-cat">Category</span>
                    <span className="lens-col-sel">Selection</span>
                    <span className="lens-col-price">Regular Price</span>
                    <span className="lens-col-price insurance">Your Price</span>
                  </div>
                  {getLensSelections(selectedOrder).map((item, index) => (
                    <div key={index} className="lens-table-data-row">
                      <span className="lens-col-cat">{item.label}</span>
                      <span className="lens-col-sel">{item.value}</span>
                      <span className="lens-col-price">{formatCurrency(item.price)}</span>
                      <span className="lens-col-price insurance">{formatCurrency(item.insurance_price)}</span>
                    </div>
                  ))}
                  <div className="lens-table-totals-row">
                    <span className="lens-col-cat"><strong>Total:</strong></span>
                    <span className="lens-col-sel"></span>
                    <span className="lens-col-price"><strong>{formatCurrency(selectedOrder.total_lens_charges)}</strong></span>
                    <span className="lens-col-price insurance"><strong>{formatCurrency(selectedOrder.total_lens_insurance_charges || selectedOrder.total_lens_charges)}</strong></span>
                  </div>
                </div>
              </section>

              {/* Pricing - 3-column layout */}
              <section className="detail-section">
                <h4>Pricing</h4>
                {(() => {
                  // Calculate insurance pricing values
                  const materialCopay = selectedOrder.material_copay || selectedOrder.insurance_copay || 0;
                  const insuranceRegularPrice = (selectedOrder.final_frame_price || 0) + (selectedOrder.total_lens_insurance_charges || 0);
                  const insuranceAfterCopay = insuranceRegularPrice + materialCopay;
                  const insuranceSalesTax = insuranceAfterCopay * 0.0225;
                  const insuranceYouPay = insuranceAfterCopay + insuranceSalesTax + (selectedOrder.other_charges_adjustment || 0);
                  const insuranceFinalPrice = insuranceYouPay + (selectedOrder.warranty_price || 0);

                  return (
                    <div className="pricing-table-view">
                      <div className="pricing-table-header-row">
                        <span className="pricing-col-label"></span>
                        <span className="pricing-col-value">Regular Price</span>
                        <span className="pricing-col-value insurance">Your Price</span>
                      </div>
                      <div className="pricing-table-data-row">
                        <span className="pricing-col-label">Total Glasses Price</span>
                        <span className="pricing-col-value">{formatCurrency(selectedOrder.regular_price)}</span>
                        <span className="pricing-col-value insurance">{formatCurrency(insuranceRegularPrice)}</span>
                      </div>
                      <div className="pricing-table-data-row">
                        <span className="pricing-col-label">Material Copay</span>
                        <span className="pricing-col-value">{formatCurrency(materialCopay)}</span>
                        <span className="pricing-col-value insurance">{formatCurrency(materialCopay)}</span>
                      </div>
                      <div className="pricing-table-data-row">
                        <span className="pricing-col-label">Sales Tax (2.25%)</span>
                        <span className="pricing-col-value">{formatCurrency(selectedOrder.sales_tax)}</span>
                        <span className="pricing-col-value insurance">{formatCurrency(insuranceSalesTax)}</span>
                      </div>
                      <div className="pricing-table-data-row saved">
                        <span className="pricing-col-label">You Saved Today</span>
                        <span className="pricing-col-value">{formatCurrency(selectedOrder.you_saved)}</span>
                        <span className="pricing-col-value insurance">{formatCurrency(selectedOrder.you_saved)}</span>
                      </div>
                      <div className="pricing-table-data-row highlight">
                        <span className="pricing-col-label"><strong>You Pay</strong></span>
                        <span className="pricing-col-value"><strong>{formatCurrency(selectedOrder.you_pay)}</strong></span>
                        <span className="pricing-col-value insurance"><strong>{formatCurrency(insuranceYouPay)}</strong></span>
                      </div>
                      {selectedOrder.warranty_type && selectedOrder.warranty_type !== 'None' && (
                        <div className="pricing-table-data-row">
                          <span className="pricing-col-label">Warranty ({selectedOrder.warranty_type})</span>
                          <span className="pricing-col-value">{formatCurrency(selectedOrder.warranty_price)}</span>
                          <span className="pricing-col-value insurance">{formatCurrency(selectedOrder.warranty_price)}</span>
                        </div>
                      )}
                      <div className="pricing-table-totals-row">
                        <span className="pricing-col-label"><strong>Final Price</strong></span>
                        <span className="pricing-col-value"><strong>{formatCurrency(selectedOrder.final_price)}</strong></span>
                        <span className="pricing-col-value insurance"><strong>{formatCurrency(insuranceFinalPrice)}</strong></span>
                      </div>
                    </div>
                  );
                })()}
                {selectedOrder.warranty_type && selectedOrder.warranty_type !== 'None' && (
                  <div style={{ marginTop: '0.75rem', padding: '0.5rem 0.75rem', backgroundColor: '#f8f9fa', borderRadius: '4px', border: '1px solid #dee2e6', fontSize: '0.875rem', textAlign: 'center' }}>
                    If Warranty Accepted - Copays: Frame {formatCurrency((selectedOrder.frame_price || 0) * 0.15)} | Lens {formatCurrency((selectedOrder.total_lens_charges || 0) * 0.15)}
                  </div>
                )}
              </section>

              {/* Other Charges Section */}
              {(selectedOrder.other_percent_adjustment > 0 || selectedOrder.iwellness === 'yes' ||
                selectedOrder.other_charge_1_price > 0 || selectedOrder.other_charge_2_price > 0 ||
                selectedOrder.other_charges_notes) && (
                <section className="detail-section">
                  <h4>Other Charges</h4>
                  <div className="pricing-breakdown">
                    {selectedOrder.other_percent_adjustment > 0 && (
                      <div className="pricing-row">
                        <span>Other % Adjustment ({selectedOrder.other_percent_adjustment}%):</span>
                        <span>-{formatCurrency((selectedOrder.final_price || 0) * (selectedOrder.other_percent_adjustment / 100))}</span>
                      </div>
                    )}
                    {selectedOrder.iwellness === 'yes' && (
                      <div className="pricing-row">
                        <span>iWellness:</span>
                        <span>{formatCurrency(selectedOrder.iwellness_price || 39.00)}</span>
                      </div>
                    )}
                    {selectedOrder.other_charge_1_type && selectedOrder.other_charge_1_type !== 'none' && selectedOrder.other_charge_1_price > 0 && (
                      <div className="pricing-row">
                        <span>
                          {selectedOrder.other_charge_1_type === 'exam_copay' ? 'Exam Copay' :
                           selectedOrder.other_charge_1_type === 'cl_exam' ? 'CL Exam' : 'Other Charge'}:
                        </span>
                        <span>{formatCurrency(selectedOrder.other_charge_1_price)}</span>
                      </div>
                    )}
                    {selectedOrder.other_charge_2_type && selectedOrder.other_charge_2_type !== 'none' && selectedOrder.other_charge_2_price > 0 && (
                      <div className="pricing-row">
                        <span>
                          {selectedOrder.other_charge_2_type === 'exam_copay' ? 'Exam Copay' :
                           selectedOrder.other_charge_2_type === 'cl_exam' ? 'CL Exam' : 'Other Charge'}:
                        </span>
                        <span>{formatCurrency(selectedOrder.other_charge_2_price)}</span>
                      </div>
                    )}
                    {selectedOrder.other_charges_notes && (
                      <div className="pricing-row">
                        <span>Notes:</span>
                        <span>{selectedOrder.other_charges_notes}</span>
                      </div>
                    )}
                  </div>
                </section>
              )}

              {/* Payment Section */}
              <section className="detail-section">
                <h4>Payment</h4>
                {(() => {
                  // Calculate insurance final price
                  const materialCopay = selectedOrder.material_copay || selectedOrder.insurance_copay || 0;
                  const insuranceRegularPrice = (selectedOrder.final_frame_price || 0) + (selectedOrder.total_lens_insurance_charges || 0);
                  const insuranceAfterCopay = insuranceRegularPrice + materialCopay;
                  const insuranceSalesTax = insuranceAfterCopay * 0.0225;
                  const insuranceYouPay = insuranceAfterCopay + insuranceSalesTax + (selectedOrder.other_charges_adjustment || 0);
                  const insuranceFinalPrice = insuranceYouPay + (selectedOrder.warranty_price || 0);

                  const paymentToday = selectedOrder.payment_today || 0;
                  const percentAdjustmentRate = (selectedOrder.other_percent_adjustment || 0) / 100;

                  // Calculate additional charges (iWellness, Other Charge 1, Other Charge 2)
                  const additionalCharges = (selectedOrder.iwellness_price || 0) +
                    (selectedOrder.other_charge_1_price || 0) +
                    (selectedOrder.other_charge_2_price || 0);

                  // NEW FORMULA: percentAdjustment is calculated on finalPrice (not finalPrice - paymentToday)
                  // Insurance: total_balance = insuranceFinalPrice - percentAdjustment + additionalCharges
                  const percentAdjustmentInsurance = insuranceFinalPrice * percentAdjustmentRate;
                  const totalBalanceInsurance = insuranceFinalPrice - percentAdjustmentInsurance + additionalCharges;
                  const balanceDueInsurance = totalBalanceInsurance - paymentToday;

                  // Regular (without insurance): total_balance = final_price - percentAdjustment + additionalCharges
                  const percentAdjustmentRegular = (selectedOrder.final_price || 0) * percentAdjustmentRate;
                  const totalBalanceRegular = (selectedOrder.final_price || 0) - percentAdjustmentRegular + additionalCharges;
                  const balanceDueRegular = totalBalanceRegular - paymentToday;

                  // Use the saved payment mode from the order
                  const savedPaymentMode = selectedOrder.payment_mode || 'with_insurance';
                  const isWithInsurance = savedPaymentMode === 'with_insurance';

                  return (
                    <>
                      {/* Payment Mode Display (Read-Only) */}
                      <div className="payment-mode-display">
                        <span className="payment-mode-label">Payment Mode:</span>
                        <span className={`payment-mode-badge ${isWithInsurance ? 'with-insurance' : 'without-insurance'}`}>
                          {isWithInsurance ? 'With Insurance' : 'Without Insurance'}
                        </span>
                      </div>

                      <div className="payment-details">
                        {/* Balance row - total balance including all Other Charges */}
                        <div className="payment-row">
                          <span className="payment-label">Balance:</span>
                          <span className="payment-value">
                            {isWithInsurance
                              ? formatCurrency(totalBalanceInsurance)
                              : formatCurrency(totalBalanceRegular)}
                          </span>
                        </div>
                        {/* Today's Payment */}
                        <div className="payment-row">
                          <span className="payment-label">Today's Payment:</span>
                          <span className="payment-value">{formatCurrency(paymentToday)}</span>
                        </div>
                        {/* Balance Due at Pick Up - highlighted */}
                        <div className="payment-row highlight">
                          <span className="payment-label">Balance Due at Pick Up:</span>
                          <span className="payment-value">
                            {isWithInsurance
                              ? formatCurrency(balanceDueInsurance)
                              : formatCurrency(balanceDueRegular)}
                          </span>
                        </div>
                      </div>
                    </>
                  );
                })()}
              </section>

              {/* Prescription */}
              <section className="detail-section">
                <h4>Prescription Details</h4>
                <table className="prescription-table">
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
                      <td>{selectedOrder.od_pd || '-'}</td>
                      <td>{selectedOrder.os_pd || '-'}</td>
                      <td>{selectedOrder.binocular_pd || '-'}</td>
                    </tr>
                    <tr>
                      <td><strong>Seg Height</strong></td>
                      <td>{selectedOrder.od_seg_height || '-'}</td>
                      <td>{selectedOrder.os_seg_height || '-'}</td>
                      <td></td>
                    </tr>
                  </tbody>
                </table>
              </section>

              {/* Special Notes */}
              {selectedOrder.special_notes && (
                <section className="detail-section">
                  <h4>Special Notes</h4>
                  <p>{selectedOrder.special_notes}</p>
                </section>
              )}

              {/* Service Rating */}
              {selectedOrder.service_rating && (
                <section className="detail-section">
                  <h4>Service Rating</h4>
                  <p>{selectedOrder.service_rating}/10</p>
                </section>
              )}
               <div><strong>Verified By:</strong> {selectedOrder.verified_by_employee_name || selectedOrder.verified_by || 'N/A'}</div>
            </div>

            <div className="modal-footer">
              <button onClick={() => handlePrint(selectedOrder.id)} className="btn btn-primary">
                Print Order
              </button>
              <button onClick={() => handleGeneratePDF(selectedOrder.id)} className="btn btn-secondary">
                Save as PDF
              </button>
              <button onClick={() => setShowDetails(false)} className="btn btn-secondary">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default OrderHistory;

