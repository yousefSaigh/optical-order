/**
 * Path Validation Utility
 * Provides security validation for file system paths
 * to prevent path traversal attacks.
 */

const path = require('path');
const { app } = require('electron');
const fs = require('fs');

/**
 * Get list of allowed directories for file operations
 * @returns {string[]} Array of allowed absolute paths
 */
function getAllowedDirectories() {
  return [
    app.getPath('documents'),
    app.getPath('downloads'),
    app.getPath('desktop'),
    app.getPath('userData'),
    // Temp directory for temporary files
    require('os').tmpdir()
  ].filter(p => p && typeof p === 'string');
}

/**
 * Validate that a path is safe for file operations
 * @param {string} inputPath - The path to validate
 * @param {Object} options - Validation options
 * @param {boolean} options.restrictToAllowed - If true, restrict to allowed directories (default: false)
 * @param {string[]} options.additionalAllowed - Additional allowed base paths
 * @returns {Object} - { isValid, resolvedPath, error }
 */
function validatePath(inputPath, options = {}) {
  // Handle legacy call signature: validatePath(path, additionalAllowed[])
  if (Array.isArray(options)) {
    options = { additionalAllowed: options, restrictToAllowed: true };
  }

  const { restrictToAllowed = false, additionalAllowed = [] } = options;

  if (!inputPath || typeof inputPath !== 'string') {
    return {
      isValid: false,
      resolvedPath: null,
      error: 'Path is required'
    };
  }

  try {
    // Normalize and resolve the path
    const resolved = path.resolve(inputPath);

    // Check for path traversal attempts in the original input
    const normalized = path.normalize(inputPath);
    if (normalized.includes('..')) {
      return {
        isValid: false,
        resolvedPath: null,
        error: 'Path traversal is not allowed'
      };
    }

    // Only restrict to allowed directories if explicitly requested
    if (restrictToAllowed) {
      // Get allowed directories
      const allowed = [...getAllowedDirectories(), ...additionalAllowed];

      // Check if the resolved path is within any allowed directory
      const isAllowed = allowed.some(allowedDir => {
        if (!allowedDir) return false;
        const resolvedAllowed = path.resolve(allowedDir);
        return resolved.startsWith(resolvedAllowed + path.sep) ||
               resolved === resolvedAllowed;
      });

      if (!isAllowed) {
        return {
          isValid: false,
          resolvedPath: null,
          error: 'Path must be within allowed directories (Documents, Downloads, Desktop, or App Data)'
        };
      }
    }

    // Verify the path exists or can be created
    if (!fs.existsSync(resolved)) {
      // Check if parent directory exists (for new directories)
      const parentDir = path.dirname(resolved);
      if (!fs.existsSync(parentDir)) {
        return {
          isValid: false,
          resolvedPath: null,
          error: 'Parent directory does not exist'
        };
      }
    }

    return {
      isValid: true,
      resolvedPath: resolved,
      error: null
    };
  } catch (error) {
    return {
      isValid: false,
      resolvedPath: null,
      error: `Invalid path: ${error.message}`
    };
  }
}

/**
 * Validate and sanitize a filename
 * @param {string} filename - The filename to validate
 * @returns {Object} - { isValid, sanitized, error }
 */
function validateFilename(filename) {
  if (!filename || typeof filename !== 'string') {
    return {
      isValid: false,
      sanitized: null,
      error: 'Filename is required'
    };
  }

  // Remove path separators and other dangerous characters
  const dangerous = /[<>:"/\\|?*\x00-\x1f]/g;
  let sanitized = filename.replace(dangerous, '_');
  
  // Remove leading/trailing dots and spaces
  sanitized = sanitized.replace(/^[\s.]+|[\s.]+$/g, '');
  
  // Limit length
  if (sanitized.length > 200) {
    sanitized = sanitized.substring(0, 200);
  }
  
  if (sanitized.length === 0) {
    return {
      isValid: false,
      sanitized: null,
      error: 'Filename cannot be empty after sanitization'
    };
  }

  return {
    isValid: true,
    sanitized,
    error: null
  };
}

/**
 * Ensure a directory exists and is writable
 * @param {string} dirPath - The directory path
 * @returns {Object} - { exists, writable, error }
 */
function ensureDirectory(dirPath) {
  try {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
    
    // Check if writable by trying to access
    fs.accessSync(dirPath, fs.constants.W_OK);
    
    return { exists: true, writable: true, error: null };
  } catch (error) {
    return {
      exists: fs.existsSync(dirPath),
      writable: false,
      error: `Cannot access directory: ${error.message}`
    };
  }
}

module.exports = {
  validatePath,
  validateFilename,
  ensureDirectory,
  getAllowedDirectories
};

