const { getDatabase } = require('./schema');
const { validateOrder, sanitizeOrderData, validateSimpleField, validateSettingKey } = require('../validation/orderValidator');
const { formatError, logError } = require('../utils/errorHandler');

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

/**
 * Create a new order with validation and transaction safety
 * Uses transaction with retry logic to handle race conditions
 */
function createOrder(orderData) {
  const db = getDatabase();

  // Step 1: Validate input
  const validation = validateOrder(orderData, false);
  if (!validation.isValid) {
    const errorMessages = validation.errors.map(e => e.message).join(', ');
    throw new Error(`Validation failed: ${errorMessages}`);
  }

  // Step 2: Sanitize validated data
  const data = sanitizeOrderData(validation.value);

  // Step 3: Use transaction with retry for atomic order creation
  const MAX_RETRIES = 5;
  let lastError = null;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const result = db.transaction(() => {
        // Generate order number inside transaction
        let orderNumber = generateOrderNumber();

        // Prepare INSERT statement
        const stmt = db.prepare(`
          INSERT INTO orders (
            order_number, patient_name, order_date, doctor_id, account_number, insurance, sold_by, employee_id,
            od_pd, os_pd, od_seg_height, os_seg_height, binocular_pd,
            use_own_frame, frame_sku, frame_material, frame_name, frame_formula, frame_price,
            frame_allowance, frame_discount_percent, final_frame_price,
            lens_design, lens_design_price, lens_material, lens_material_price,
            ar_coating, ar_coating_price, blue_light, blue_light_price,
            transition, transition_price, polarized, polarized_price,
            aspheric, aspheric_price,
            edge_treatment, edge_treatment_price, prism, prism_price,
            other_option, other_option_price,
            lens_selections_json,
            total_lens_charges, total_lens_insurance_charges, regular_price, sales_tax, insurance_copay, you_pay, you_saved,
            warranty_type, warranty_price, final_price,
            other_charges_adjustment, other_charges_notes,
            other_percent_adjustment, iwellness, iwellness_price,
            other_charge_1_type, other_charge_1_price, other_charge_2_type, other_charge_2_price,
            payment_today, balance_due, balance_due_regular, payment_mode,
            special_notes, verified_by, verified_by_employee_id, status,
            service_rating
          ) VALUES (
            ?, ?, ?, ?, ?, ?, ?, ?,
            ?, ?, ?, ?, ?,
            ?,
            ?, ?, ?, ?, ?,
            ?, ?, ?,
            ?, ?, ?, ?,
            ?, ?, ?, ?,
            ?, ?, ?, ?,
            ?, ?,
            ?, ?, ?, ?,
            ?, ?,
            ?,
            ?, ?, ?, ?, ?, ?, ?,
            ?, ?, ?,
            ?, ?,
            ?, ?, ?,
            ?, ?, ?, ?,
            ?, ?, ?, ?,
            ?, ?, ?, ?,
            ?
          )
        `);

        const insertResult = stmt.run(
          orderNumber,
          data.patient_name,
          data.order_date,
          data.doctor_id || null,
          data.account_number || '',
          data.insurance || '',
          data.sold_by || '',
          data.employee_id || null,
          data.od_pd || '',
          data.os_pd || '',
          data.od_seg_height || '',
          data.os_seg_height || '',
          data.binocular_pd || '',
          data.use_own_frame ? 1 : 0,
          data.frame_sku || '',
          data.frame_material || '',
          data.frame_name || '',
          data.frame_formula || '',
          data.frame_price || 0,
          data.frame_allowance || 0,
          data.frame_discount_percent || 0,
          data.final_frame_price || 0,
          data.lens_design || '',
          data.lens_design_price || 0,
          data.lens_material || '',
          data.lens_material_price || 0,
          data.ar_coating || '',
          data.ar_coating_price || 0,
          data.blue_light || '',
          data.blue_light_price || 0,
          data.transition || '',
          data.transition_price || 0,
          data.polarized || '',
          data.polarized_price || 0,
          data.aspheric || '',
          data.aspheric_price || 0,
          data.edge_treatment || '',
          data.edge_treatment_price || 0,
          data.prism || '',
          data.prism_price || 0,
          data.other_option || '',
          data.other_option_price || 0,
          data.lens_selections_json || '{}',
          data.total_lens_charges || 0,
          data.total_lens_insurance_charges || 0,
          data.regular_price || 0,
          data.sales_tax || 0,
          data.material_copay || data.insurance_copay || 0,
          data.you_pay || 0,
          data.you_saved || 0,
          data.warranty_type || 'None',
          data.warranty_price || 0,
          data.final_price || 0,
          data.other_charges_adjustment || 0,
          data.other_charges_notes || '',
          data.other_percent_adjustment || 0,
          data.iwellness || 'no',
          data.iwellness_price || 0,
          data.other_charge_1_type || 'none',
          data.other_charge_1_price || 0,
          data.other_charge_2_type || 'none',
          data.other_charge_2_price || 0,
          data.payment_today || 0,
          data.balance_due || 0,
          data.balance_due_regular || 0,
          data.payment_mode || 'with_insurance',
          data.special_notes || '',
          data.verified_by || '',
          data.verified_by_employee_id || null,
          data.status || 'pending',
          data.service_rating || null
        );

        return {
          id: insertResult.lastInsertRowid,
          order_number: orderNumber
        };
      })();

      // Transaction succeeded
      return result;

    } catch (error) {
      lastError = error;

      // Only retry on unique constraint violation (order number collision)
      if (error.code === 'SQLITE_CONSTRAINT_UNIQUE' &&
          error.message.includes('order_number') &&
          attempt < MAX_RETRIES - 1) {
        console.log(`Order number collision, retrying (attempt ${attempt + 1}/${MAX_RETRIES})...`);
        continue;
      }

      // Log and rethrow other errors
      logError(error, { operation: 'createOrder', attempt });
      throw error;
    }
  }

  // All retries exhausted
  throw lastError || new Error('Failed to create order after multiple attempts');
}

function getOrders(limit = 100, offset = 0, includeDeleted = false) {
  const db = getDatabase();
  const whereClause = includeDeleted ? '' : 'WHERE (o.deleted_at IS NULL OR o.deleted_at = \'\')';
  return db.prepare(`
    SELECT o.*, d.name as doctor_name,
           e.name as employee_name, e.initials as employee_initials,
           v.name as verified_by_employee_name, v.initials as verified_by_employee_initials
    FROM orders o
    LEFT JOIN doctors d ON o.doctor_id = d.id
    LEFT JOIN employees e ON o.employee_id = e.id
    LEFT JOIN employees v ON o.verified_by_employee_id = v.id
    ${whereClause}
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

function searchOrders(searchTerm, includeDeleted = false) {
  const db = getDatabase();
  // Escape special LIKE characters to prevent unexpected behavior
  const escapedTerm = searchTerm.replace(/[%_]/g, '\\$&');
  const term = `%${escapedTerm}%`;
  const deleteFilter = includeDeleted ? '' : 'AND (o.deleted_at IS NULL OR o.deleted_at = \'\')';
  return db.prepare(`
    SELECT o.*, d.name as doctor_name,
           e.name as employee_name, e.initials as employee_initials,
           v.name as verified_by_employee_name, v.initials as verified_by_employee_initials
    FROM orders o
    LEFT JOIN doctors d ON o.doctor_id = d.id
    LEFT JOIN employees e ON o.employee_id = e.id
    LEFT JOIN employees v ON o.verified_by_employee_id = v.id
    WHERE (o.patient_name LIKE ? ESCAPE '\\'
       OR o.order_number LIKE ? ESCAPE '\\'
       OR o.account_number LIKE ? ESCAPE '\\'
       OR e.name LIKE ? ESCAPE '\\'
       OR e.initials LIKE ? ESCAPE '\\')
    ${deleteFilter}
    ORDER BY o.created_at DESC
    LIMIT 100
  `).all(term, term, term, term, term);
}

/**
 * Update an existing order with validation
 */
function updateOrder(id, orderData) {
  const db = getDatabase();

  // Validate input (isUpdate=true for less strict validation)
  const validation = validateOrder(orderData, true);
  if (!validation.isValid) {
    const errorMessages = validation.errors.map(e => e.message).join(', ');
    throw new Error(`Validation failed: ${errorMessages}`);
  }

  // Sanitize validated data
  const data = sanitizeOrderData(validation.value);

  const stmt = db.prepare(`
    UPDATE orders SET
      patient_name = ?, order_date = ?, doctor_id = ?, account_number = ?, insurance = ?, sold_by = ?, employee_id = ?,
      od_pd = ?, os_pd = ?, od_seg_height = ?, os_seg_height = ?, binocular_pd = ?,
      use_own_frame = ?, frame_sku = ?, frame_material = ?, frame_name = ?, frame_formula = ?, frame_price = ?,
      frame_allowance = ?, frame_discount_percent = ?, final_frame_price = ?,
      lens_design = ?, lens_design_price = ?, lens_material = ?, lens_material_price = ?,
      ar_coating = ?, ar_coating_price = ?, blue_light = ?, blue_light_price = ?,
      transition = ?, transition_price = ?, polarized = ?, polarized_price = ?,
      aspheric = ?, aspheric_price = ?,
      edge_treatment = ?, edge_treatment_price = ?, prism = ?, prism_price = ?,
      other_option = ?, other_option_price = ?,
      lens_selections_json = ?,
      total_lens_charges = ?, total_lens_insurance_charges = ?, regular_price = ?, sales_tax = ?, insurance_copay = ?, you_pay = ?, you_saved = ?,
      warranty_type = ?, warranty_price = ?, final_price = ?,
      other_charges_adjustment = ?, other_charges_notes = ?,
      other_percent_adjustment = ?, iwellness = ?, iwellness_price = ?,
      other_charge_1_type = ?, other_charge_1_price = ?, other_charge_2_type = ?, other_charge_2_price = ?,
      payment_today = ?, balance_due = ?, balance_due_regular = ?, payment_mode = ?,
      special_notes = ?, verified_by = ?, verified_by_employee_id = ?, status = ?,
      service_rating = ?,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ? AND (deleted_at IS NULL OR deleted_at = '')
  `);

  const result = stmt.run(
    data.patient_name, data.order_date, data.doctor_id, data.account_number,
    data.insurance, data.sold_by, data.employee_id || null,
    data.od_pd, data.os_pd, data.od_seg_height, data.os_seg_height, data.binocular_pd || '',
    data.use_own_frame ? 1 : 0, data.frame_sku, data.frame_material,
    data.frame_name, data.frame_formula, data.frame_price,
    data.frame_allowance, data.frame_discount_percent, data.final_frame_price,
    data.lens_design,
    data.lens_design_price, data.lens_material, data.lens_material_price,
    data.ar_coating, data.ar_coating_price, data.blue_light, data.blue_light_price,
    data.transition, data.transition_price,
    data.polarized, data.polarized_price,
    data.aspheric,
    data.aspheric_price, data.edge_treatment, data.edge_treatment_price,
    data.prism, data.prism_price, data.other_option, data.other_option_price,
    data.lens_selections_json || '{}',
    data.total_lens_charges, data.total_lens_insurance_charges || 0, data.regular_price, data.sales_tax, data.material_copay || data.insurance_copay,
    data.you_pay, data.you_saved, data.warranty_type || 'None', data.warranty_price,
    data.final_price, data.other_charges_adjustment, data.other_charges_notes,
    data.other_percent_adjustment || 0, data.iwellness || 'no', data.iwellness_price || 0,
    data.other_charge_1_type || 'none', data.other_charge_1_price || 0,
    data.other_charge_2_type || 'none', data.other_charge_2_price || 0,
    data.payment_today, data.balance_due, data.balance_due_regular || 0, data.payment_mode || 'with_insurance',
    data.special_notes, data.verified_by, data.verified_by_employee_id || null,
    data.status || 'pending', data.service_rating || null, id
  );

  if (result.changes === 0) {
    throw new Error('Order not found or has been deleted');
  }
}

/**
 * Soft delete an order (sets deleted_at timestamp)
 * Order can be recovered using restoreOrder()
 */
function deleteOrder(id) {
  const db = getDatabase();
  const stmt = db.prepare(`
    UPDATE orders
    SET deleted_at = datetime('now'),
        status = 'deleted',
        updated_at = datetime('now')
    WHERE id = ? AND (deleted_at IS NULL OR deleted_at = '')
  `);
  const result = stmt.run(id);

  if (result.changes === 0) {
    throw new Error('Order not found or already deleted');
  }
}

/**
 * Permanently delete an order (use with caution!)
 */
function hardDeleteOrder(id) {
  const db = getDatabase();
  const stmt = db.prepare('DELETE FROM orders WHERE id = ?');
  const result = stmt.run(id);

  if (result.changes === 0) {
    throw new Error('Order not found');
  }
}

/**
 * Restore a soft-deleted order
 */
function restoreOrder(id) {
  const db = getDatabase();
  const stmt = db.prepare(`
    UPDATE orders
    SET deleted_at = NULL,
        status = 'pending',
        updated_at = datetime('now')
    WHERE id = ? AND deleted_at IS NOT NULL
  `);
  const result = stmt.run(id);

  if (result.changes === 0) {
    throw new Error('Order not found or is not deleted');
  }
}

/**
 * Get deleted orders for recovery purposes
 */
function getDeletedOrders(limit = 100) {
  const db = getDatabase();
  return db.prepare(`
    SELECT o.*, d.name as doctor_name,
           e.name as employee_name, e.initials as employee_initials
    FROM orders o
    LEFT JOIN doctors d ON o.doctor_id = d.id
    LEFT JOIN employees e ON o.employee_id = e.id
    WHERE o.deleted_at IS NOT NULL AND o.deleted_at != ''
    ORDER BY o.deleted_at DESC
    LIMIT ?
  `).all(limit);
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
  hardDeleteOrder,
  restoreOrder,
  getDeletedOrders,

  // Settings
  getSetting,
  setSetting,
  getAllSettings,

  // Validation utilities (re-exported for use in main.js)
  validateSettingKey
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

