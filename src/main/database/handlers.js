const { getDatabase } = require('./schema');

// ============ DROPDOWN OPTIONS ============

function getDropdownOptions(category) {
  const db = getDatabase();
  return db.prepare(`
    SELECT * FROM dropdown_options 
    WHERE category = ? AND is_active = 1 
    ORDER BY sort_order, label
  `).all(category);
}

function getAllDropdownOptions() {
  const db = getDatabase();
  return db.prepare(`
    SELECT * FROM dropdown_options 
    WHERE is_active = 1 
    ORDER BY category, sort_order, label
  `).all();
}

function addDropdownOption(option) {
  const db = getDatabase();
  const stmt = db.prepare(`
    INSERT INTO dropdown_options (category, label, value, price, sort_order)
    VALUES (?, ?, ?, ?, ?)
  `);
  const result = stmt.run(
    option.category,
    option.label,
    option.value,
    option.price || 0,
    option.sort_order || 0
  );
  return result.lastInsertRowid;
}

function updateDropdownOption(id, option) {
  const db = getDatabase();
  const stmt = db.prepare(`
    UPDATE dropdown_options 
    SET label = ?, value = ?, price = ?, sort_order = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `);
  stmt.run(option.label, option.value, option.price, option.sort_order, id);
}

function deleteDropdownOption(id) {
  const db = getDatabase();
  const stmt = db.prepare('UPDATE dropdown_options SET is_active = 0 WHERE id = ?');
  stmt.run(id);
}

// ============ DOCTORS ============

function getDoctors() {
  const db = getDatabase();
  return db.prepare('SELECT * FROM doctors WHERE is_active = 1 ORDER BY name').all();
}

function addDoctor(name) {
  const db = getDatabase();
  const stmt = db.prepare('INSERT INTO doctors (name) VALUES (?)');
  const result = stmt.run(name);
  return result.lastInsertRowid;
}

function updateDoctor(id, name) {
  const db = getDatabase();
  const stmt = db.prepare('UPDATE doctors SET name = ? WHERE id = ?');
  stmt.run(name, id);
}

function deleteDoctor(id) {
  const db = getDatabase();
  const stmt = db.prepare('UPDATE doctors SET is_active = 0 WHERE id = ?');
  stmt.run(id);
}

// ============ INSURANCE PROVIDERS ============

function getInsuranceProviders() {
  const db = getDatabase();
  return db.prepare('SELECT * FROM insurance_providers WHERE is_active = 1 ORDER BY name').all();
}

function addInsuranceProvider(name) {
  const db = getDatabase();
  const stmt = db.prepare('INSERT INTO insurance_providers (name) VALUES (?)');
  const result = stmt.run(name);
  return result.lastInsertRowid;
}

function updateInsuranceProvider(id, name) {
  const db = getDatabase();
  const stmt = db.prepare('UPDATE insurance_providers SET name = ? WHERE id = ?');
  stmt.run(name, id);
}

function deleteInsuranceProvider(id) {
  const db = getDatabase();
  const stmt = db.prepare('UPDATE insurance_providers SET is_active = 0 WHERE id = ?');
  stmt.run(id);
}

// ============ EMPLOYEES ============

function getEmployees() {
  const db = getDatabase();
  return db.prepare('SELECT * FROM employees WHERE is_active = 1 ORDER BY name').all();
}

function getAllEmployees() {
  const db = getDatabase();
  return db.prepare('SELECT * FROM employees ORDER BY name').all();
}

function getEmployeeById(id) {
  const db = getDatabase();
  return db.prepare('SELECT * FROM employees WHERE id = ?').get(id);
}

function addEmployee(name, initials) {
  const db = getDatabase();
  const stmt = db.prepare('INSERT INTO employees (name, initials) VALUES (?, ?)');
  const result = stmt.run(name, initials);
  return result.lastInsertRowid;
}

function updateEmployee(id, name, initials) {
  const db = getDatabase();
  const stmt = db.prepare('UPDATE employees SET name = ?, initials = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?');
  stmt.run(name, initials, id);
}

function deleteEmployee(id) {
  const db = getDatabase();
  // Soft delete - set is_active to 0
  const stmt = db.prepare('UPDATE employees SET is_active = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?');
  stmt.run(id);
}

function reactivateEmployee(id) {
  const db = getDatabase();
  const stmt = db.prepare('UPDATE employees SET is_active = 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?');
  stmt.run(id);
}

function hardDeleteEmployee(id) {
  const db = getDatabase();
  // Check if employee has any orders
  const ordersCount = db.prepare('SELECT COUNT(*) as count FROM orders WHERE employee_id = ?').get(id);
  if (ordersCount.count > 0) {
    throw new Error(`Cannot delete employee: they have ${ordersCount.count} order(s) associated. Deactivate instead.`);
  }
  const stmt = db.prepare('DELETE FROM employees WHERE id = ?');
  stmt.run(id);
}

// ============ LENS CATEGORIES ============

function getLensCategories() {
  const db = getDatabase();
  return db.prepare(`
    SELECT * FROM lens_categories
    ORDER BY sort_order, display_label
  `).all();
}

function getActiveLensCategories() {
  const db = getDatabase();
  return db.prepare(`
    SELECT * FROM lens_categories
    WHERE is_active = 1
    ORDER BY sort_order, display_label
  `).all();
}

function addLensCategory(category) {
  const db = getDatabase();

  // Validate category_key (no spaces, lowercase, underscores only)
  const categoryKey = category.category_key.toLowerCase().replace(/[^a-z0-9_]/g, '_');

  const stmt = db.prepare(`
    INSERT INTO lens_categories (category_key, display_label, sort_order, is_system)
    VALUES (?, ?, ?, ?)
  `);

  const result = stmt.run(
    categoryKey,
    category.display_label,
    category.sort_order || 0,
    0 // Custom categories are never system categories
  );

  return result.lastInsertRowid;
}

function updateLensCategory(id, category) {
  const db = getDatabase();

  const stmt = db.prepare(`
    UPDATE lens_categories
    SET display_label = ?, sort_order = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ? AND is_system = 0
  `);

  stmt.run(category.display_label, category.sort_order, id);
}

function deleteLensCategory(id) {
  const db = getDatabase();

  // Only allow deleting custom categories (not system categories)
  const stmt = db.prepare('DELETE FROM lens_categories WHERE id = ? AND is_system = 0');
  stmt.run(id);
}

function toggleLensCategoryActive(id) {
  const db = getDatabase();

  const current = db.prepare('SELECT is_active FROM lens_categories WHERE id = ?').get(id);
  const newStatus = current.is_active === 1 ? 0 : 1;

  const stmt = db.prepare(`
    UPDATE lens_categories
    SET is_active = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `);

  stmt.run(newStatus, id);
}

// ============ ORDERS ============

function generateOrderNumber() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `ORD-${year}${month}${day}-${random}`;
}

function createOrder(orderData) {
  const db = getDatabase();
  
  // Generate unique order number
  let orderNumber = generateOrderNumber();
  while (db.prepare('SELECT id FROM orders WHERE order_number = ?').get(orderNumber)) {
    orderNumber = generateOrderNumber();
  }
  
  const stmt = db.prepare(`
    INSERT INTO orders (
      order_number, patient_name, order_date, doctor_id, account_number, insurance, sold_by, employee_id,
      od_pd, os_pd, od_seg_height, os_seg_height,
      frame_sku, frame_material, frame_name, frame_formula, frame_price,
      frame_allowance, frame_discount_percent, final_frame_price,
      lens_design, lens_design_price, lens_material, lens_material_price,
      ar_coating, ar_coating_price, blue_light, blue_light_price,
      transition_polarized, transition_polarized_price, aspheric, aspheric_price,
      edge_treatment, edge_treatment_price, prism, prism_price,
      other_option, other_option_price,
      lens_selections_json,
      total_lens_charges, total_lens_insurance_charges, regular_price, sales_tax, insurance_copay, you_pay, you_saved,
      warranty_type, warranty_price, final_price,
      other_charges_adjustment, other_charges_notes,
      other_percent_adjustment, iwellness, iwellness_price,
      other_charge_1_type, other_charge_1_price, other_charge_2_type, other_charge_2_price,
      payment_today, balance_due, balance_due_regular, payment_mode,
      special_notes, verified_by, verified_by_employee_id, status
    ) VALUES (
      ?, ?, ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?,
      ?, ?, ?, ?, ?,
      ?, ?, ?,
      ?, ?, ?, ?,
      ?, ?, ?, ?,
      ?, ?, ?, ?,
      ?, ?, ?, ?,
      ?, ?,
      ?,
      ?, ?, ?, ?, ?, ?, ?,
      ?, ?, ?,
      ?, ?,
      ?, ?, ?,
      ?, ?, ?, ?,
      ?, ?, ?, ?,
      ?, ?, ?, ?
    )
  `);

  const result = stmt.run(
    orderNumber,
    orderData.patient_name,
    orderData.order_date,
    orderData.doctor_id || null,
    orderData.account_number || '',
    orderData.insurance || '',
    orderData.sold_by || '',
    orderData.employee_id || null,
    orderData.od_pd || '',
    orderData.os_pd || '',
    orderData.od_seg_height || '',
    orderData.os_seg_height || '',
    orderData.frame_sku || '',
    orderData.frame_material || '',
    orderData.frame_name || '',
    orderData.frame_formula || '',
    orderData.frame_price || 0,
    orderData.frame_allowance || 0,
    orderData.frame_discount_percent || 0,
    orderData.final_frame_price || 0,
    orderData.lens_design || '',
    orderData.lens_design_price || 0,
    orderData.lens_material || '',
    orderData.lens_material_price || 0,
    orderData.ar_coating || '',
    orderData.ar_coating_price || 0,
    orderData.blue_light || '',
    orderData.blue_light_price || 0,
    orderData.transition_polarized || '',
    orderData.transition_polarized_price || 0,
    orderData.aspheric || '',
    orderData.aspheric_price || 0,
    orderData.edge_treatment || '',
    orderData.edge_treatment_price || 0,
    orderData.prism || '',
    orderData.prism_price || 0,
    orderData.other_option || '',
    orderData.other_option_price || 0,
    orderData.lens_selections_json || '{}',
    orderData.total_lens_charges || 0,
    orderData.total_lens_insurance_charges || 0,
    orderData.regular_price || 0,
    orderData.sales_tax || 0,
    orderData.material_copay || orderData.insurance_copay || 0,
    orderData.you_pay || 0,
    orderData.you_saved || 0,
    orderData.warranty_type || 'None',
    orderData.warranty_price || 0,
    orderData.final_price || 0,
    orderData.other_charges_adjustment || 0,
    orderData.other_charges_notes || '',
    orderData.other_percent_adjustment || 0,
    orderData.iwellness || 'no',
    orderData.iwellness_price || 0,
    orderData.other_charge_1_type || 'none',
    orderData.other_charge_1_price || 0,
    orderData.other_charge_2_type || 'none',
    orderData.other_charge_2_price || 0,
    orderData.payment_today || 0,
    orderData.balance_due || 0,
    orderData.balance_due_regular || 0,
    orderData.payment_mode || 'with_insurance',
    orderData.special_notes || '',
    orderData.verified_by || '',
    orderData.verified_by_employee_id || null,
    orderData.status || 'pending'
  );

  return {
    id: result.lastInsertRowid,
    order_number: orderNumber
  };
}

function getOrders(limit = 100, offset = 0) {
  const db = getDatabase();
  return db.prepare(`
    SELECT o.*, d.name as doctor_name,
           e.name as employee_name, e.initials as employee_initials,
           v.name as verified_by_employee_name, v.initials as verified_by_employee_initials
    FROM orders o
    LEFT JOIN doctors d ON o.doctor_id = d.id
    LEFT JOIN employees e ON o.employee_id = e.id
    LEFT JOIN employees v ON o.verified_by_employee_id = v.id
    ORDER BY o.created_at DESC
    LIMIT ? OFFSET ?
  `).all(limit, offset);
}

function getOrderById(id) {
  const db = getDatabase();
  return db.prepare(`
    SELECT o.*, d.name as doctor_name,
           e.name as employee_name, e.initials as employee_initials,
           v.name as verified_by_employee_name, v.initials as verified_by_employee_initials
    FROM orders o
    LEFT JOIN doctors d ON o.doctor_id = d.id
    LEFT JOIN employees e ON o.employee_id = e.id
    LEFT JOIN employees v ON o.verified_by_employee_id = v.id
    WHERE o.id = ?
  `).get(id);
}

function searchOrders(searchTerm) {
  const db = getDatabase();
  const term = `%${searchTerm}%`;
  return db.prepare(`
    SELECT o.*, d.name as doctor_name,
           e.name as employee_name, e.initials as employee_initials,
           v.name as verified_by_employee_name, v.initials as verified_by_employee_initials
    FROM orders o
    LEFT JOIN doctors d ON o.doctor_id = d.id
    LEFT JOIN employees e ON o.employee_id = e.id
    LEFT JOIN employees v ON o.verified_by_employee_id = v.id
    WHERE o.patient_name LIKE ?
       OR o.order_number LIKE ?
       OR o.account_number LIKE ?
       OR e.name LIKE ?
       OR e.initials LIKE ?
    ORDER BY o.created_at DESC
    LIMIT 100
  `).all(term, term, term, term, term);
}

function updateOrder(id, orderData) {
  const db = getDatabase();
  // Similar to createOrder but with UPDATE
  const stmt = db.prepare(`
    UPDATE orders SET
      patient_name = ?, order_date = ?, doctor_id = ?, account_number = ?, insurance = ?, sold_by = ?, employee_id = ?,
      od_pd = ?, os_pd = ?, od_seg_height = ?, os_seg_height = ?,
      frame_sku = ?, frame_material = ?, frame_name = ?, frame_formula = ?, frame_price = ?,
      frame_allowance = ?, frame_discount_percent = ?, final_frame_price = ?,
      lens_design = ?, lens_design_price = ?, lens_material = ?, lens_material_price = ?,
      ar_coating = ?, ar_coating_price = ?, blue_light = ?, blue_light_price = ?,
      transition_polarized = ?, transition_polarized_price = ?, aspheric = ?, aspheric_price = ?,
      edge_treatment = ?, edge_treatment_price = ?, prism = ?, prism_price = ?,
      other_option = ?, other_option_price = ?,
      lens_selections_json = ?,
      total_lens_charges = ?, total_lens_insurance_charges = ?, regular_price = ?, sales_tax = ?, insurance_copay = ?, you_pay = ?, you_saved = ?,
      warranty_type = ?, warranty_price = ?, final_price = ?,
      other_charges_adjustment = ?, other_charges_notes = ?,
      payment_today = ?, balance_due = ?, balance_due_regular = ?, payment_mode = ?,
      special_notes = ?, verified_by = ?, verified_by_employee_id = ?, status = ?,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `);

  stmt.run(
    orderData.patient_name, orderData.order_date, orderData.doctor_id, orderData.account_number,
    orderData.insurance, orderData.sold_by, orderData.employee_id || null,
    orderData.od_pd, orderData.os_pd, orderData.od_seg_height, orderData.os_seg_height,
    orderData.frame_sku, orderData.frame_material,
    orderData.frame_name, orderData.frame_formula, orderData.frame_price,
    orderData.frame_allowance, orderData.frame_discount_percent, orderData.final_frame_price,
    orderData.lens_design,
    orderData.lens_design_price, orderData.lens_material, orderData.lens_material_price,
    orderData.ar_coating, orderData.ar_coating_price, orderData.blue_light, orderData.blue_light_price,
    orderData.transition_polarized, orderData.transition_polarized_price, orderData.aspheric,
    orderData.aspheric_price, orderData.edge_treatment, orderData.edge_treatment_price,
    orderData.prism, orderData.prism_price, orderData.other_option, orderData.other_option_price,
    orderData.lens_selections_json || '{}',
    orderData.total_lens_charges, orderData.total_lens_insurance_charges || 0, orderData.regular_price, orderData.sales_tax, orderData.material_copay || orderData.insurance_copay,
    orderData.you_pay, orderData.you_saved, orderData.warranty_type || 'None', orderData.warranty_price,
    orderData.final_price, orderData.other_charges_adjustment, orderData.other_charges_notes,
    orderData.payment_today, orderData.balance_due, orderData.balance_due_regular || 0, orderData.payment_mode || 'with_insurance',
    orderData.special_notes, orderData.verified_by, orderData.verified_by_employee_id || null,
    orderData.status || 'pending', id
  );
}

function deleteOrder(id) {
  const db = getDatabase();
  const stmt = db.prepare('DELETE FROM orders WHERE id = ?');
  stmt.run(id);
}

module.exports = {
  // Dropdown options
  getDropdownOptions,
  getAllDropdownOptions,
  addDropdownOption,
  updateDropdownOption,
  deleteDropdownOption,

  // Doctors
  getDoctors,
  addDoctor,
  updateDoctor,
  deleteDoctor,

  // Insurance Providers
  getInsuranceProviders,
  addInsuranceProvider,
  updateInsuranceProvider,
  deleteInsuranceProvider,

  // Lens Categories
  getLensCategories,
  getActiveLensCategories,
  addLensCategory,
  updateLensCategory,
  deleteLensCategory,
  toggleLensCategoryActive,

  // Employees
  getEmployees,
  getAllEmployees,
  getEmployeeById,
  addEmployee,
  updateEmployee,
  deleteEmployee,
  reactivateEmployee,
  hardDeleteEmployee,

  // Orders
  createOrder,
  getOrders,
  getOrderById,
  searchOrders,
  updateOrder,
  deleteOrder,

  // Settings
  getSetting,
  setSetting,
  getAllSettings
};

// ============ SETTINGS ============

function getSetting(key) {
  const db = getDatabase();
  const result = db.prepare('SELECT setting_value FROM app_settings WHERE setting_key = ?').get(key);
  return result ? result.setting_value : null;
}

function setSetting(key, value) {
  const db = getDatabase();
  const stmt = db.prepare(`
    INSERT INTO app_settings (setting_key, setting_value)
    VALUES (?, ?)
    ON CONFLICT(setting_key) DO UPDATE SET
      setting_value = excluded.setting_value,
      updated_at = CURRENT_TIMESTAMP
  `);
  stmt.run(key, value);
}

function getAllSettings() {
  const db = getDatabase();
  const rows = db.prepare('SELECT setting_key, setting_value FROM app_settings').all();
  const settings = {};
  rows.forEach(row => {
    settings[row.setting_key] = row.setting_value;
  });
  return settings;
}

