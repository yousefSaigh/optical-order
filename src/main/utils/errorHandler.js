/**
 * Error Handler Utility
 * Provides user-friendly error messages and error classification
 */

/**
 * Map of technical error patterns to user-friendly messages
 */
const ERROR_MAPPINGS = {
  // Database errors
  'SQLITE_CONSTRAINT_UNIQUE': 'A record with this information already exists.',
  'SQLITE_CONSTRAINT_FOREIGNKEY': 'Referenced record does not exist. Please refresh and try again.',
  'SQLITE_CONSTRAINT_NOTNULL': 'A required field is missing.',
  'SQLITE_BUSY': 'Database is busy. Please try again in a moment.',
  'SQLITE_LOCKED': 'Database is locked. Please try again.',
  'SQLITE_CORRUPT': 'Database error occurred. Please contact support.',
  'SQLITE_NOTADB': 'Database file is corrupted. Please contact support.',
  
  // Validation errors
  'Validation failed': 'Please check your input and try again.',
  'Patient name is required': 'Please enter the patient name.',
  'Order date is required': 'Please select an order date.',
  
  // File system errors
  'ENOENT': 'The requested file or folder was not found.',
  'EACCES': 'Permission denied. Please check file permissions.',
  'ENOSPC': 'Not enough disk space available.',
  'EPERM': 'Operation not permitted.',
  
  // PDF errors
  'PDF generation failed': 'Could not generate PDF. Please try again.',
  
  // Print errors
  'Print failed': 'Printing failed. Please check printer connection.',
  
  // Network/IPC errors
  'IPC_ERROR': 'Communication error. Please restart the application.',
  
  // Generic fallbacks
  'Cannot read property': 'An unexpected error occurred. Please try again.',
  'undefined is not': 'An unexpected error occurred. Please try again.',
  'null is not': 'An unexpected error occurred. Please try again.'
};

/**
 * Error severity levels
 */
const ERROR_SEVERITY = {
  INFO: 'info',
  WARNING: 'warning',
  ERROR: 'error',
  CRITICAL: 'critical'
};

/**
 * Convert a technical error to a user-friendly message
 * @param {Error|string} error - The error to convert
 * @returns {Object} - { message, severity, technical }
 */
function formatError(error) {
  const errorMessage = error instanceof Error ? error.message : String(error);
  const errorCode = error?.code || '';
  
  // Check for matching patterns
  for (const [pattern, friendlyMessage] of Object.entries(ERROR_MAPPINGS)) {
    if (errorMessage.includes(pattern) || errorCode.includes(pattern)) {
      return {
        message: friendlyMessage,
        severity: getSeverity(pattern),
        technical: errorMessage,
        code: errorCode
      };
    }
  }
  
  // Check if it's a validation error with specific field info
  if (errorMessage.includes('Validation failed:')) {
    const fieldErrors = errorMessage.replace('Validation failed: ', '');
    return {
      message: `Please fix the following: ${fieldErrors}`,
      severity: ERROR_SEVERITY.WARNING,
      technical: errorMessage,
      code: 'VALIDATION_ERROR'
    };
  }
  
  // Default fallback - sanitize the message to remove technical details
  return {
    message: sanitizeErrorMessage(errorMessage),
    severity: ERROR_SEVERITY.ERROR,
    technical: errorMessage,
    code: errorCode || 'UNKNOWN_ERROR'
  };
}

/**
 * Get severity level for an error pattern
 */
function getSeverity(pattern) {
  const criticalPatterns = ['SQLITE_CORRUPT', 'SQLITE_NOTADB', 'CRITICAL'];
  const warningPatterns = ['SQLITE_BUSY', 'SQLITE_LOCKED', 'Validation'];
  
  if (criticalPatterns.some(p => pattern.includes(p))) {
    return ERROR_SEVERITY.CRITICAL;
  }
  if (warningPatterns.some(p => pattern.includes(p))) {
    return ERROR_SEVERITY.WARNING;
  }
  return ERROR_SEVERITY.ERROR;
}

/**
 * Sanitize error message to remove sensitive/technical information
 */
function sanitizeErrorMessage(message) {
  // Remove file paths
  let sanitized = message.replace(/[A-Za-z]:\\[^\s]+/g, '[path]');
  sanitized = sanitized.replace(/\/[^\s]+/g, '[path]');
  
  // Remove SQL statements
  sanitized = sanitized.replace(/SELECT\s+.+?FROM/gi, '[query]');
  sanitized = sanitized.replace(/INSERT\s+INTO/gi, '[query]');
  sanitized = sanitized.replace(/UPDATE\s+.+?SET/gi, '[query]');
  sanitized = sanitized.replace(/DELETE\s+FROM/gi, '[query]');
  
  // If the message is too technical, return generic message
  if (sanitized.includes('[query]') || sanitized.includes('[path]')) {
    return 'An error occurred while processing your request. Please try again.';
  }
  
  // Truncate very long messages
  if (sanitized.length > 200) {
    return sanitized.substring(0, 197) + '...';
  }
  
  return sanitized;
}

/**
 * Log error with context for debugging (can be enhanced for remote logging)
 */
function logError(error, context = {}) {
  const formatted = formatError(error);
  console.error('Application Error:', {
    ...formatted,
    context,
    timestamp: new Date().toISOString()
  });
  return formatted;
}

module.exports = {
  formatError,
  logError,
  sanitizeErrorMessage,
  ERROR_SEVERITY
};

