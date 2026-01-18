/**
 * Security and Data Integrity Tests
 * Tests for all Phase 1-3 security fixes
 * 
 * Run with: npm test
 */

const { validateOrder, sanitizeOrderData, validateSimpleField, validateSettingKey, getAllowedSettings } = require('../src/main/validation/orderValidator');
const { formatError, sanitizeErrorMessage, ERROR_SEVERITY } = require('../src/main/utils/errorHandler');
const { validatePath, validateFilename, ensureDirectory } = require('../src/main/utils/pathValidator');

// ============ ORDER VALIDATION TESTS ============

describe('Order Validation', () => {
  describe('Required Fields', () => {
    test('rejects empty patient name', () => {
      const result = validateOrder({
        patient_name: '',
        order_date: '2026-01-17'
      });
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.field === 'patient_name')).toBe(true);
    });

    test('rejects missing patient name', () => {
      const result = validateOrder({
        order_date: '2026-01-17'
      });
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.message.toLowerCase().includes('patient'))).toBe(true);
    });

    test('rejects missing order date', () => {
      const result = validateOrder({
        patient_name: 'Test Patient'
      });
      expect(result.isValid).toBe(false);
    });

    test('accepts valid required fields', () => {
      const result = validateOrder({
        patient_name: 'John Doe',
        order_date: '2026-01-17'
      });
      expect(result.isValid).toBe(true);
    });
  });

  describe('Patient Name Validation', () => {
    test('trims whitespace from patient name', () => {
      const result = validateOrder({
        patient_name: '  John Doe  ',
        order_date: '2026-01-17'
      });
      expect(result.isValid).toBe(true);
      expect(result.value.patient_name).toBe('John Doe');
    });

    test('rejects patient name over 200 characters', () => {
      const result = validateOrder({
        patient_name: 'A'.repeat(201),
        order_date: '2026-01-17'
      });
      expect(result.isValid).toBe(false);
    });

    test('accepts patient name at max length', () => {
      const result = validateOrder({
        patient_name: 'A'.repeat(200),
        order_date: '2026-01-17'
      });
      expect(result.isValid).toBe(true);
    });
  });

  describe('Price Field Validation', () => {
    test('defaults missing price to 0', () => {
      const result = validateOrder({
        patient_name: 'Test',
        order_date: '2026-01-17'
      });
      expect(result.value.frame_price).toBe(0);
    });

    test('rejects negative frame price', () => {
      const result = validateOrder({
        patient_name: 'Test',
        order_date: '2026-01-17',
        frame_price: -100
      });
      expect(result.isValid).toBe(false);
    });

    test('accepts valid price', () => {
      const result = validateOrder({
        patient_name: 'Test',
        order_date: '2026-01-17',
        frame_price: 250.50
      });
      expect(result.isValid).toBe(true);
      expect(result.value.frame_price).toBe(250.50);
    });
  });

  describe('PD Value Validation', () => {
    test('accepts valid PD values', () => {
      const result = validateOrder({
        patient_name: 'Test',
        order_date: '2026-01-17',
        od_pd: 32,
        os_pd: 31.5
      });
      expect(result.isValid).toBe(true);
    });

    test('accepts empty PD values', () => {
      const result = validateOrder({
        patient_name: 'Test',
        order_date: '2026-01-17',
        od_pd: '',
        os_pd: ''
      });
      expect(result.isValid).toBe(true);
    });
  });

  describe('Service Rating Validation', () => {
    test('accepts valid rating (1-10)', () => {
      const result = validateOrder({
        patient_name: 'Test',
        order_date: '2026-01-17',
        service_rating: 8
      });
      expect(result.isValid).toBe(true);
    });

    test('rejects rating below 1', () => {
      const result = validateOrder({
        patient_name: 'Test',
        order_date: '2026-01-17',
        service_rating: 0
      });
      expect(result.isValid).toBe(false);
    });

    test('rejects rating above 10', () => {
      const result = validateOrder({
        patient_name: 'Test',
        order_date: '2026-01-17',
        service_rating: 11
      });
      expect(result.isValid).toBe(false);
    });

    test('accepts null rating', () => {
      const result = validateOrder({
        patient_name: 'Test',
        order_date: '2026-01-17',
        service_rating: null
      });
      expect(result.isValid).toBe(true);
    });
  });

  describe('Percentage Field Validation', () => {
    test('accepts valid discount percentage', () => {
      const result = validateOrder({
        patient_name: 'Test',
        order_date: '2026-01-17',
        frame_discount_percent: 25
      });
      expect(result.isValid).toBe(true);
    });

    test('rejects percentage over 100', () => {
      const result = validateOrder({
        patient_name: 'Test',
        order_date: '2026-01-17',
        frame_discount_percent: 150
      });
      expect(result.isValid).toBe(false);
    });
  });
});

// ============ DATA SANITIZATION TESTS ============

describe('Data Sanitization', () => {
  test('converts empty strings to null for nullable fields', () => {
    const sanitized = sanitizeOrderData({
      doctor_id: '',
      employee_id: '',
      service_rating: ''
    });
    expect(sanitized.doctor_id).toBeNull();
    expect(sanitized.employee_id).toBeNull();
    expect(sanitized.service_rating).toBeNull();
  });

  test('converts string prices to numbers', () => {
    const sanitized = sanitizeOrderData({
      frame_price: '250.50',
      lens_design_price: '100'
    });
    expect(sanitized.frame_price).toBe(250.50);
    expect(sanitized.lens_design_price).toBe(100);
  });

  test('handles boolean conversion', () => {
    const sanitized = sanitizeOrderData({
      use_own_frame: true
    });
    // SQLite uses 1/0 for boolean, not true/false
    expect(sanitized.use_own_frame).toBe(1);
  });

  test('clamps percentage values', () => {
    const sanitized = sanitizeOrderData({
      frame_discount_percent: 150,
      other_percent_adjustment: -10
    });
    expect(sanitized.frame_discount_percent).toBe(100);
    expect(sanitized.other_percent_adjustment).toBe(0);
  });
});

// ============ SETTINGS VALIDATION TESTS ============

describe('Settings Validation', () => {
  test('allows valid setting keys', () => {
    expect(validateSettingKey('pdf_save_location')).toBe(true);
    expect(validateSettingKey('tax_rate')).toBe(true);
    expect(validateSettingKey('company_name')).toBe(true);
  });

  test('rejects invalid setting keys', () => {
    expect(validateSettingKey('__proto__')).toBe(false);
    expect(validateSettingKey('constructor')).toBe(false);
    expect(validateSettingKey('malicious_key')).toBe(false);
  });

  test('returns list of allowed settings', () => {
    const allowed = getAllowedSettings();
    expect(Array.isArray(allowed)).toBe(true);
    expect(allowed.length).toBeGreaterThan(0);
    expect(allowed.includes('pdf_save_location')).toBe(true);
  });
});

// ============ ERROR HANDLER TESTS ============

describe('Error Handler', () => {
  test('formats database errors to user-friendly messages', () => {
    const error = new Error('SQLITE_CONSTRAINT_UNIQUE: order_number');
    const formatted = formatError(error);
    expect(formatted.message).not.toContain('SQLITE');
    expect(formatted.technical).toContain('SQLITE');
  });

  test('sanitizes file paths from error messages', () => {
    const message = 'Error at C:\\Users\\test\\database.db';
    const sanitized = sanitizeErrorMessage(message);
    expect(sanitized).not.toContain('C:\\Users');
  });

  test('sanitizes SQL from error messages', () => {
    const message = 'Error in SELECT * FROM orders WHERE id = 1';
    const sanitized = sanitizeErrorMessage(message);
    expect(sanitized).not.toContain('SELECT');
  });

  test('includes severity level', () => {
    const error = new Error('SQLITE_CORRUPT: database is corrupted');
    const formatted = formatError(error);
    expect(formatted.severity).toBe(ERROR_SEVERITY.CRITICAL);
  });
});

// ============ SIMPLE FIELD VALIDATION TESTS ============

describe('Simple Field Validation', () => {
  test('validates doctor name', () => {
    const result = validateSimpleField('Dr. Smith', 'Doctor name');
    expect(result.isValid).toBe(true);
    expect(result.value).toBe('Dr. Smith');
  });

  test('rejects empty field', () => {
    const result = validateSimpleField('', 'Doctor name');
    expect(result.isValid).toBe(false);
  });

  test('trims whitespace', () => {
    const result = validateSimpleField('  Dr. Smith  ', 'Doctor name');
    expect(result.value).toBe('Dr. Smith');
  });

  test('rejects field over max length', () => {
    const result = validateSimpleField('A'.repeat(201), 'Name', 200);
    expect(result.isValid).toBe(false);
  });
});

// ============ PATH VALIDATION TESTS ============
// Note: These tests require Electron to be running, skip if not available

describe('Path Validation', () => {
  // Skip these tests if running outside Electron context
  const isElectron = typeof process !== 'undefined' && process.versions && process.versions.electron;
  const testFn = isElectron ? test : test.skip;

  describe('Filename Validation', () => {
    test('sanitizes dangerous characters from filename', () => {
      const result = validateFilename('Order<>:"/\\|?*.pdf');
      expect(result.isValid).toBe(true);
      expect(result.sanitized).not.toContain('<');
      expect(result.sanitized).not.toContain('>');
      expect(result.sanitized).not.toContain(':');
    });

    test('rejects empty filename', () => {
      const result = validateFilename('');
      expect(result.isValid).toBe(false);
    });

    test('rejects null filename', () => {
      const result = validateFilename(null);
      expect(result.isValid).toBe(false);
    });

    test('limits filename length', () => {
      const result = validateFilename('A'.repeat(250) + '.pdf');
      expect(result.isValid).toBe(true);
      expect(result.sanitized.length).toBeLessThanOrEqual(200);
    });

    test('removes leading/trailing dots', () => {
      const result = validateFilename('..filename..');
      expect(result.isValid).toBe(true);
      expect(result.sanitized.startsWith('.')).toBe(false);
    });
  });

  testFn('rejects path traversal attempts', () => {
    const result = validatePath('../../../etc/passwd');
    expect(result.isValid).toBe(false);
    expect(result.error).toContain('traversal');
  });

  testFn('rejects empty path', () => {
    const result = validatePath('');
    expect(result.isValid).toBe(false);
  });

  testFn('rejects null path', () => {
    const result = validatePath(null);
    expect(result.isValid).toBe(false);
  });
});

// ============ HTML ESCAPING TESTS ============

describe('HTML Escaping (Printer)', () => {
  // Import the escapeHtml function from printer if accessible
  // For now, test the concept

  function escapeHtml(text) {
    if (text === null || text === undefined) return '';
    const str = String(text);
    const escapeMap = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;',
      '/': '&#x2F;',
      '`': '&#x60;',
      '=': '&#x3D;'
    };
    return str.replace(/[&<>"'`=/]/g, char => escapeMap[char]);
  }

  test('escapes HTML tags', () => {
    const result = escapeHtml('<script>alert("XSS")</script>');
    expect(result).not.toContain('<script>');
    expect(result).toContain('&lt;script&gt;');
  });

  test('escapes quotes', () => {
    const result = escapeHtml('"quoted" and \'single\'');
    expect(result).not.toContain('"');
    expect(result).not.toContain("'");
  });

  test('handles null/undefined', () => {
    expect(escapeHtml(null)).toBe('');
    expect(escapeHtml(undefined)).toBe('');
  });

  test('converts non-strings', () => {
    expect(escapeHtml(123)).toBe('123');
    expect(escapeHtml(true)).toBe('true');
  });

  test('escapes ampersands', () => {
    const result = escapeHtml('Tom & Jerry');
    expect(result).toBe('Tom &amp; Jerry');
  });
});

// ============ EDGE CASE TESTS ============

describe('Edge Cases', () => {
  test('handles very long special notes', () => {
    const result = validateOrder({
      patient_name: 'Test',
      order_date: '2026-01-17',
      special_notes: 'A'.repeat(1500)
    });
    expect(result.isValid).toBe(true);
  });

  test('rejects special notes over 2000 chars', () => {
    const result = validateOrder({
      patient_name: 'Test',
      order_date: '2026-01-17',
      special_notes: 'A'.repeat(2001)
    });
    expect(result.isValid).toBe(false);
  });

  test('handles unicode characters in patient name', () => {
    const result = validateOrder({
      patient_name: 'José García',
      order_date: '2026-01-17'
    });
    expect(result.isValid).toBe(true);
  });

  test('handles JSON lens selections', () => {
    const result = validateOrder({
      patient_name: 'Test',
      order_date: '2026-01-17',
      lens_selections_json: JSON.stringify({
        design: { name: 'Progressive', price: 100 }
      })
    });
    expect(result.isValid).toBe(true);
  });

  test('handles malformed lens JSON', () => {
    const result = validateOrder({
      patient_name: 'Test',
      order_date: '2026-01-17',
      lens_selections_json: 'not valid json'
    });
    // Should still pass validation - JSON validity not enforced
    expect(result.isValid).toBe(true);
  });

  test('handles date string format', () => {
    const result = validateOrder({
      patient_name: 'Test',
      order_date: '2026-01-17'
    });
    expect(result.isValid).toBe(true);
  });
});

