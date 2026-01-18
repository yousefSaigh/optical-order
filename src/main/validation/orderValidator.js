/**
 * Order Validation Module
 * Provides comprehensive server-side validation for order data
 * to prevent data corruption and ensure data integrity.
 */

const Joi = require('joi');

// Custom validation for optional numeric fields that can be empty strings
const optionalNumber = Joi.alternatives().try(
  Joi.number(),
  Joi.string().empty('').default(null)
).allow(null, '');

// Custom validation for optional positive numbers
const optionalPositiveNumber = Joi.alternatives().try(
  Joi.number().min(0),
  Joi.string().empty('').default(null)
).allow(null, '');

// Price field - must be non-negative, defaults to 0
const priceField = Joi.number().min(0).max(999999.99).default(0);

// Percentage field - 0-100
const percentField = Joi.number().min(0).max(100).default(0);

// PD (Pupillary Distance) field - typically 20-45mm per eye
const pdField = Joi.alternatives().try(
  Joi.number().min(15).max(50),
  Joi.string().pattern(/^[0-9.]*$/).empty('').default('')
).allow(null, '');

// Binocular PD - typically 45-85mm
const binocularPdField = Joi.alternatives().try(
  Joi.number().min(30).max(100),
  Joi.string().pattern(/^[0-9.]*$/).empty('').default('')
).allow(null, '');

// Seg height field - numeric or empty
const segHeightField = Joi.alternatives().try(
  Joi.number().min(5).max(50),
  Joi.string().pattern(/^[0-9.]*$/).empty('').default('')
).allow(null, '');

/**
 * Main order validation schema
 */
const orderSchema = Joi.object({
  // Required fields
  patient_name: Joi.string()
    .required()
    .min(1)
    .max(200)
    .trim()
    .messages({
      'string.empty': 'Patient name is required',
      'string.max': 'Patient name must be less than 200 characters',
      'any.required': 'Patient name is required'
    }),

  order_date: Joi.alternatives().try(
    Joi.date().iso(),
    Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/)
  ).required().messages({
    'any.required': 'Order date is required'
  }),

  // Optional identification fields
  doctor_id: Joi.alternatives().try(
    Joi.number().integer().positive(),
    Joi.string().empty('').default(null)
  ).allow(null, ''),

  employee_id: Joi.alternatives().try(
    Joi.number().integer().positive(),
    Joi.string().empty('').default(null)
  ).allow(null, ''),

  verified_by_employee_id: Joi.alternatives().try(
    Joi.number().integer().positive(),
    Joi.string().empty('').default(null)
  ).allow(null, ''),

  account_number: Joi.string().max(100).allow('', null).default(''),
  insurance: Joi.string().max(200).allow('', null).default(''),
  sold_by: Joi.string().max(100).allow('', null).default(''),
  verified_by: Joi.string().max(100).allow('', null).default(''),

  // Prescription measurements
  od_pd: pdField,
  os_pd: pdField,
  binocular_pd: binocularPdField,
  od_seg_height: segHeightField,
  os_seg_height: segHeightField,

  // Frame information
  use_own_frame: Joi.boolean().default(false),
  frame_sku: Joi.string().max(100).allow('', null).default(''),
  frame_material: Joi.string().max(100).allow('', null).default(''),
  frame_name: Joi.string().max(200).allow('', null).default(''),
  frame_formula: Joi.string().max(50).allow('', null).default(''),
  
  // Frame pricing
  frame_price: priceField,
  frame_allowance: priceField,
  frame_discount_percent: percentField,
  final_frame_price: priceField,

  // Legacy lens fields
  lens_design: Joi.string().max(100).allow('', null).default(''),
  lens_design_price: priceField,
  lens_material: Joi.string().max(100).allow('', null).default(''),
  lens_material_price: priceField,
  ar_coating: Joi.string().max(100).allow('', null).default(''),
  ar_coating_price: priceField,
  blue_light: Joi.string().max(100).allow('', null).default(''),
  blue_light_price: priceField,
  transition: Joi.string().max(100).allow('', null).default(''),
  transition_price: priceField,
  polarized: Joi.string().max(100).allow('', null).default(''),
  polarized_price: priceField,
  aspheric: Joi.string().max(100).allow('', null).default(''),
  aspheric_price: priceField,
  edge_treatment: Joi.string().max(100).allow('', null).default(''),
  edge_treatment_price: priceField,
  prism: Joi.string().max(100).allow('', null).default(''),
  prism_price: priceField,
  other_option: Joi.string().max(100).allow('', null).default(''),
  other_option_price: priceField,

  // JSON lens selections
  lens_selections_json: Joi.string().max(10000).allow('', null).default('{}'),

  // Calculated totals
  total_lens_charges: priceField,
  total_lens_insurance_charges: priceField,
  regular_price: priceField,
  sales_tax: priceField,
  insurance_copay: priceField,
  material_copay: priceField,
  you_pay: priceField,
  you_saved: priceField,

  // Warranty
  warranty_type: Joi.string().max(100).allow('', null).default('None'),
  warranty_price: priceField,
  final_price: priceField,

  // Other charges
  other_charges_adjustment: Joi.number().min(-99999).max(99999).default(0),
  other_charges_notes: Joi.string().max(500).allow('', null).default(''),
  other_percent_adjustment: percentField,
  iwellness: Joi.string().valid('yes', 'no').default('no'),
  iwellness_price: priceField,
  custom_service_description: Joi.string().max(200).allow('', null),
  custom_service_price: priceField,
  other_charge_1_type: Joi.string().max(100).allow('', null).default('none'),
  other_charge_1_price: priceField,
  other_charge_2_type: Joi.string().max(100).allow('', null).default('none'),
  other_charge_2_price: priceField,

  // Payment
  payment_today: priceField,
  balance_due: Joi.number().min(-99999).max(999999).default(0),
  balance_due_regular: Joi.number().min(-99999).max(999999).default(0),
  payment_mode: Joi.string().valid('with_insurance', 'without_insurance').default('with_insurance'),

  // Notes and status
  special_notes: Joi.string().max(2000).allow('', null).default(''),
  status: Joi.string().valid('pending', 'processing', 'completed', 'cancelled', 'deleted').default('pending'),

  // Service rating (1-10)
  service_rating: Joi.alternatives().try(
    Joi.number().integer().min(1).max(10),
    Joi.string().empty('').default(null)
  ).allow(null, '')
}).unknown(true); // Allow unknown fields for forward compatibility

/**
 * Validate order data
 * @param {Object} orderData - The order data to validate
 * @param {boolean} isUpdate - Whether this is an update (less strict)
 * @returns {Object} - { isValid, value, errors }
 */
function validateOrder(orderData, isUpdate = false) {
  const schema = isUpdate ? orderSchema.fork(['patient_name', 'order_date'], (schema) => schema.optional()) : orderSchema;

  const { error, value } = schema.validate(orderData, {
    abortEarly: false,
    stripUnknown: false,
    convert: true
  });

  if (error) {
    const errors = error.details.map(d => ({
      field: d.path.join('.'),
      message: d.message
    }));
    return {
      isValid: false,
      value: orderData,
      errors
    };
  }

  return {
    isValid: true,
    value,
    errors: []
  };
}

/**
 * Sanitize order data - converts and cleans values for database insertion
 * @param {Object} orderData - The validated order data
 * @returns {Object} - Sanitized order data
 */
function sanitizeOrderData(orderData) {
  const sanitized = { ...orderData };

  // CRITICAL: Convert Date objects to ISO string format for SQLite
  // Joi's date() validator converts strings to Date objects
  if (sanitized.order_date instanceof Date) {
    sanitized.order_date = sanitized.order_date.toISOString().split('T')[0]; // YYYY-MM-DD format
  } else if (typeof sanitized.order_date === 'string' && sanitized.order_date.includes('T')) {
    // Handle ISO datetime strings - extract just the date part
    sanitized.order_date = sanitized.order_date.split('T')[0];
  }

  // Convert empty strings to null for nullable fields
  const nullableFields = ['doctor_id', 'employee_id', 'verified_by_employee_id', 'service_rating'];
  nullableFields.forEach(field => {
    if (sanitized[field] === '' || sanitized[field] === undefined) {
      sanitized[field] = null;
    }
  });

  // Ensure boolean conversion - SQLite needs 0 or 1, not true/false objects
  sanitized.use_own_frame = sanitized.use_own_frame ? 1 : 0;

  // Ensure price fields are numbers
  const priceFields = [
    'frame_price', 'frame_allowance', 'final_frame_price',
    'lens_design_price', 'lens_material_price', 'ar_coating_price',
    'blue_light_price', 'transition_price', 'polarized_price',
    'aspheric_price', 'edge_treatment_price', 'prism_price', 'other_option_price',
    'total_lens_charges', 'total_lens_insurance_charges', 'regular_price',
    'sales_tax', 'insurance_copay', 'you_pay', 'you_saved',
    'warranty_price', 'final_price', 'iwellness_price',
    'other_charge_1_price', 'other_charge_2_price',
    'payment_today', 'balance_due', 'balance_due_regular'
  ];

  priceFields.forEach(field => {
    if (sanitized[field] === '' || sanitized[field] === undefined || sanitized[field] === null) {
      sanitized[field] = 0;
    } else {
      sanitized[field] = parseFloat(sanitized[field]) || 0;
    }
  });

  // Ensure percentage fields are valid
  const percentFields = ['frame_discount_percent', 'other_percent_adjustment'];
  percentFields.forEach(field => {
    if (sanitized[field] === '' || sanitized[field] === undefined || sanitized[field] === null) {
      sanitized[field] = 0;
    } else {
      sanitized[field] = Math.min(100, Math.max(0, parseFloat(sanitized[field]) || 0));
    }
  });

  // Ensure all string fields are actually strings (not objects)
  const stringFields = [
    'patient_name', 'account_number', 'insurance', 'sold_by', 'verified_by',
    'od_pd', 'os_pd', 'od_seg_height', 'os_seg_height', 'binocular_pd',
    'frame_sku', 'frame_material', 'frame_name', 'frame_formula',
    'lens_design', 'lens_material', 'ar_coating', 'blue_light',
    'transition', 'polarized', 'aspheric', 'edge_treatment', 'prism',
    'other_option', 'warranty_type', 'iwellness', 'special_notes',
    'other_charges_notes', 'payment_mode', 'status',
    'other_charge_1_type', 'other_charge_2_type', 'custom_service_description'
  ];

  stringFields.forEach(field => {
    if (sanitized[field] !== null && sanitized[field] !== undefined) {
      // Convert any non-string to string
      if (typeof sanitized[field] !== 'string') {
        sanitized[field] = String(sanitized[field]);
      }
    } else {
      sanitized[field] = '';
    }
  });

  // Ensure lens_selections_json is a string
  if (sanitized.lens_selections_json !== null && sanitized.lens_selections_json !== undefined) {
    if (typeof sanitized.lens_selections_json === 'object') {
      sanitized.lens_selections_json = JSON.stringify(sanitized.lens_selections_json);
    } else if (typeof sanitized.lens_selections_json !== 'string') {
      sanitized.lens_selections_json = String(sanitized.lens_selections_json);
    }
  } else {
    sanitized.lens_selections_json = '{}';
  }

  return sanitized;
}

/**
 * Validate a simple string field (for doctors, employees, etc.)
 */
function validateSimpleField(value, fieldName, maxLength = 200) {
  if (!value || typeof value !== 'string') {
    return { isValid: false, error: `${fieldName} is required` };
  }

  const trimmed = value.trim();
  if (trimmed.length === 0) {
    return { isValid: false, error: `${fieldName} cannot be empty` };
  }

  if (trimmed.length > maxLength) {
    return { isValid: false, error: `${fieldName} must be less than ${maxLength} characters` };
  }

  return { isValid: true, value: trimmed };
}

/**
 * Validate setting key against whitelist
 */
const ALLOWED_SETTINGS = [
  'pdf_save_location',
  'company_name',
  'tax_rate',
  'default_warranty',
  'receipt_footer',
  'auto_backup_enabled',
  'backup_retention_days'
];

function validateSettingKey(key) {
  return ALLOWED_SETTINGS.includes(key);
}

function getAllowedSettings() {
  return [...ALLOWED_SETTINGS];
}

module.exports = {
  validateOrder,
  sanitizeOrderData,
  validateSimpleField,
  validateSettingKey,
  getAllowedSettings,
  orderSchema
};

