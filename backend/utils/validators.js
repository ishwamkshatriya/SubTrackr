// Common validation utilities

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} - True if valid email format
 */
const isValidEmail = (email) => {
  const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
  return emailRegex.test(email);
};

/**
 * Validate password strength
 * @param {string} password - Password to validate
 * @returns {object} - Validation result with isValid and message
 */
const validatePassword = (password) => {
  if (!password) {
    return { isValid: false, message: 'Password is required' };
  }
  
  if (password.length < 6) {
    return { isValid: false, message: 'Password must be at least 6 characters long' };
  }
  
  if (password.length > 128) {
    return { isValid: false, message: 'Password must be less than 128 characters' };
  }
  
  return { isValid: true, message: 'Password is valid' };
};

/**
 * Validate MongoDB ObjectId
 * @param {string} id - ID to validate
 * @returns {boolean} - True if valid ObjectId format
 */
const isValidObjectId = (id) => {
  const objectIdRegex = /^[0-9a-fA-F]{24}$/;
  return objectIdRegex.test(id);
};

/**
 * Validate date range
 * @param {Date|string} startDate - Start date
 * @param {Date|string} endDate - End date
 * @returns {object} - Validation result with isValid and message
 */
const validateDateRange = (startDate, endDate) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  if (isNaN(start.getTime())) {
    return { isValid: false, message: 'Invalid start date' };
  }
  
  if (isNaN(end.getTime())) {
    return { isValid: false, message: 'Invalid end date' };
  }
  
  if (end <= start) {
    return { isValid: false, message: 'End date must be after start date' };
  }
  
  return { isValid: true, message: 'Date range is valid' };
};

/**
 * Validate positive number
 * @param {number} value - Value to validate
 * @param {string} fieldName - Name of the field for error message
 * @returns {object} - Validation result with isValid and message
 */
const validatePositiveNumber = (value, fieldName = 'Value') => {
  if (value === undefined || value === null) {
    return { isValid: false, message: `${fieldName} is required` };
  }
  
  if (typeof value !== 'number' || isNaN(value)) {
    return { isValid: false, message: `${fieldName} must be a valid number` };
  }
  
  if (value < 0) {
    return { isValid: false, message: `${fieldName} must be a positive number` };
  }
  
  return { isValid: true, message: `${fieldName} is valid` };
};

/**
 * Sanitize string input
 * @param {string} input - Input to sanitize
 * @param {number} maxLength - Maximum allowed length
 * @returns {string} - Sanitized string
 */
const sanitizeString = (input, maxLength = 255) => {
  if (typeof input !== 'string') {
    return '';
  }
  
  return input.trim().substring(0, maxLength);
};

/**
 * Validate pagination parameters
 * @param {number} page - Page number
 * @param {number} limit - Items per page
 * @returns {object} - Validation result with isValid, message, and sanitized values
 */
const validatePagination = (page, limit) => {
  const pageNum = parseInt(page) || 1;
  const limitNum = parseInt(limit) || 10;
  
  if (pageNum < 1) {
    return { 
      isValid: false, 
      message: 'Page number must be greater than 0',
      page: 1,
      limit: limitNum
    };
  }
  
  if (limitNum < 1 || limitNum > 100) {
    return { 
      isValid: false, 
      message: 'Limit must be between 1 and 100',
      page: pageNum,
      limit: 10
    };
  }
  
  return { 
    isValid: true, 
    message: 'Pagination parameters are valid',
    page: pageNum,
    limit: limitNum
  };
};

module.exports = {
  isValidEmail,
  validatePassword,
  isValidObjectId,
  validateDateRange,
  validatePositiveNumber,
  sanitizeString,
  validatePagination
};
