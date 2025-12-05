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

            lensItems.push({
              label: displayLabel,
              value: selection.value,
              price: selection.price || 0
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
      { label: 'Transition/Polarized', value: order.transition_polarized, price: order.transition_polarized_price },
      { label: 'Aspheric', value: order.aspheric, price: order.aspheric_price },
      { label: 'Edge Treatment', value: order.edge_treatment, price: order.edge_treatment_price },
      { label: 'Prism', value: order.prism, price: order.prism_price },
      { label: 'Other Add-Ons', value: order.other_option, price: order.other_option_price },
    ];

    return legacyItems.filter(item => item.value && item.value !== 'None');
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
              <th>Status</th>
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
                  <td>{formatCurrency(order.final_price)}</td>
                  <td>
                    <span className={`status-badge status-${order.status}`}>
                      {order.status}
                    </span>
                  </td>
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
                  <div><strong>Sold By:</strong> {selectedOrder.sold_by || 'N/A'}</div>
                </div>
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
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td><strong>PD</strong></td>
                      <td>{selectedOrder.od_pd || '-'}</td>
                      <td>{selectedOrder.os_pd || '-'}</td>
                    </tr>
                    <tr>
                      <td><strong>Seg Height</strong></td>
                      <td>{selectedOrder.od_seg_height || '-'}</td>
                      <td>{selectedOrder.os_seg_height || '-'}</td>
                    </tr>
                  </tbody>
                </table>
              </section>

              {/* Frame */}
              <section className="detail-section">
                <h4>Frame</h4>
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
              </section>

              {/* Lenses - Dynamic */}
              <section className="detail-section">
                <h4>Lenses</h4>
                <div className="lens-details">
                  {getLensSelections(selectedOrder).map((item, index) => (
                    <div key={index} className="lens-item">
                      <span>{item.label}:</span>
                      <span>{item.value}</span>
                      <span>{formatCurrency(item.price)}</span>
                    </div>
                  ))}
                </div>
              </section>

              {/* Pricing */}
              <section className="detail-section">
                <h4>Pricing</h4>
                <div className="pricing-details">
                  <div className="pricing-row">
                    <span>Regular Price:</span>
                    <span>{formatCurrency(selectedOrder.regular_price)}</span>
                  </div>
                  <div className="pricing-row">
                    <span>Insurance Copay:</span>
                    <span>-{formatCurrency(selectedOrder.insurance_copay)}</span>
                  </div>
                  <div className="pricing-row">
                    <span>Sales Tax:</span>
                    <span>{formatCurrency(selectedOrder.sales_tax)}</span>
                  </div>
                  {selectedOrder.you_saved > 0 && (
                    <div className="pricing-row" style={{ color: '#28a745', fontWeight: '600' }}>
                      <span>You Saved Today:</span>
                      <span>{formatCurrency(selectedOrder.you_saved)}</span>
                    </div>
                  )}
                  {selectedOrder.warranty_type && selectedOrder.warranty_type !== 'None' && (
                    <>
                      <div className="pricing-row">
                        <span>One Time Protection Warranty ({selectedOrder.warranty_type}):</span>
                        <span>{formatCurrency(selectedOrder.warranty_price)}</span>
                      </div>
                      <div style={{ marginTop: '0.75rem', padding: '0.75rem', backgroundColor: '#f8f9fa', borderRadius: '4px', border: '1px solid #dee2e6' }}>
                        <div style={{ fontSize: '0.9rem', fontWeight: '600', color: '#495057', textAlign: 'center', borderBottom: '1px solid #dee2e6', paddingBottom: '0.5rem', marginBottom: '0.5rem' }}>
                          If Warranty was Accepted - One Time Protection Fee then
                        </div>
                        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '0.5rem' }}>
                          <tbody>
                            <tr>
                              <td style={{ padding: '0.5rem', border: '1px solid #333', textAlign: 'center', fontWeight: '500' }}>Frame Copay</td>
                              <td style={{ padding: '0.5rem', border: '1px solid #333', textAlign: 'center', fontWeight: '600' }}>{formatCurrency((selectedOrder.frame_price || 0) * 0.15)}</td>
                            </tr>
                            <tr>
                              <td style={{ padding: '0.5rem', border: '1px solid #333', textAlign: 'center', fontWeight: '500' }}>Lens Copay</td>
                              <td style={{ padding: '0.5rem', border: '1px solid #333', textAlign: 'center', fontWeight: '600' }}>{formatCurrency((selectedOrder.total_lens_charges || 0) * 0.15)}</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </>
                  )}
                  <div className="pricing-row total">
                    <strong>Final Price:</strong>
                    <strong>{formatCurrency(selectedOrder.final_price)}</strong>
                  </div>
                </div>
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
                        <span>-{formatCurrency((selectedOrder.final_price - (selectedOrder.payment_today || 0)) * (selectedOrder.other_percent_adjustment / 100))}</span>
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
                <div className="pricing-breakdown">
                  <div className="pricing-row">
                    <span>Payment Today:</span>
                    <span>{formatCurrency(selectedOrder.payment_today)}</span>
                  </div>
                  <div className="pricing-row">
                    <span>Balance Due at Pick Up:</span>
                    <span>{formatCurrency(selectedOrder.balance_due)}</span>
                  </div>
                </div>
              </section>

              {/* Special Notes */}
              {selectedOrder.special_notes && (
                <section className="detail-section">
                  <h4>Special Notes</h4>
                  <p>{selectedOrder.special_notes}</p>
                </section>
              )}
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

