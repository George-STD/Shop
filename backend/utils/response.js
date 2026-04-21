/**
 * Standardized API response utilities
 * Ensures consistent response format across all endpoints
 */

const isObject = (value) => typeof value === 'object' && value !== null && !Array.isArray(value);

const hasAnyKey = (obj, keys) => keys.some((key) => Object.prototype.hasOwnProperty.call(obj, key));

/**
 * Send a success response
 * @param {Object} res - Express response object
 * @param {Object} options - Response options
 * @param {*} options.data - Data to include in response
 * @param {string} options.message - Success message
 * @param {number} options.statusCode - HTTP status code (default: 200)
 * @param {Object} options.pagination - Pagination info (optional)
 */
const sendSuccess = (res, optionsOrData = {}, legacyMessage, legacyStatusCode) => {
  let data;
  let message;
  let statusCode = 200;
  let pagination;

  if (isObject(optionsOrData) && hasAnyKey(optionsOrData, ['data', 'message', 'statusCode', 'pagination'])) {
    ({ data, message, statusCode = 200, pagination } = optionsOrData);
  } else {
    data = optionsOrData;
    message = legacyMessage;
    statusCode = legacyStatusCode ?? 200;
  }

  const response = {
    success: true,
  };

  if (message) {
    response.message = message;
  }

  if (data !== undefined) {
    response.data = data;
  }

  if (pagination) {
    response.pagination = pagination;
  }

  return res.status(statusCode).json(response);
};

/**
 * Send an error response
 * @param {Object} res - Express response object
 * @param {Object} options - Response options
 * @param {string} options.message - Error message
 * @param {number} options.statusCode - HTTP status code (default: 500)
 * @param {Array} options.errors - Validation errors array (optional)
 * @param {Object} options.data - Additional data (optional)
 */
const sendError = (res, optionsOrMessage = {}, legacyStatusCode, legacyErrors) => {
  let message;
  let statusCode = 500;
  let errors;
  let data;

  if (typeof optionsOrMessage === 'string') {
    message = optionsOrMessage;
    statusCode = legacyStatusCode ?? 500;
    errors = legacyErrors;
  } else if (isObject(optionsOrMessage) && hasAnyKey(optionsOrMessage, ['message', 'statusCode', 'errors', 'data'])) {
    ({ message, statusCode = 500, errors, data } = optionsOrMessage);
    if (legacyStatusCode !== undefined && optionsOrMessage.statusCode === undefined) {
      statusCode = legacyStatusCode;
    }
    if (legacyErrors !== undefined && optionsOrMessage.errors === undefined) {
      errors = legacyErrors;
    }
  } else {
    message = undefined;
    statusCode = legacyStatusCode ?? 500;
    errors = legacyErrors;
  }

  const response = {
    success: false,
    message: message || 'حدث خطأ في الخادم',
  };

  if (errors) {
    response.errors = errors;
  }

  if (data) {
    response.data = data;
  }

  return res.status(statusCode).json(response);
};

/**
 * Send a 400 Bad Request response
 * @param {Object} res - Express response object
 * @param {string} message - Error message
 * @param {Array} errors - Validation errors (optional)
 */
const sendBadRequest = (res, message, errors) => {
  return sendError(res, { message, statusCode: 400, errors });
};

/**
 * Send a 401 Unauthorized response
 * @param {Object} res - Express response object
 * @param {string} message - Error message
 */
const sendUnauthorized = (res, message = 'غير مصرح لك بالوصول') => {
  return sendError(res, { message, statusCode: 401 });
};

/**
 * Send a 403 Forbidden response
 * @param {Object} res - Express response object
 * @param {string} message - Error message
 */
const sendForbidden = (res, message = 'ليس لديك صلاحية للوصول') => {
  return sendError(res, { message, statusCode: 403 });
};

/**
 * Send a 404 Not Found response
 * @param {Object} res - Express response object
 * @param {string} message - Error message
 */
const sendNotFound = (res, message = 'العنصر غير موجود') => {
  return sendError(res, { message, statusCode: 404 });
};

/**
 * Send a 500 Internal Server Error response
 * @param {Object} res - Express response object
 * @param {string} message - Error message
 */
const sendServerError = (res, message = 'حدث خطأ في الخادم') => {
  return sendError(res, { message, statusCode: 500 });
};

/**
 * Send a created (201) response
 * @param {Object} res - Express response object
 * @param {Object} options - Response options
 */
const sendCreated = (res, optionsOrData = {}, legacyMessage) => {
  if (isObject(optionsOrData) && hasAnyKey(optionsOrData, ['data', 'message'])) {
    return sendSuccess(res, { ...optionsOrData, statusCode: 201 });
  }

  return sendSuccess(res, {
    data: optionsOrData,
    message: legacyMessage,
    statusCode: 201,
  });
};

/**
 * Send a paginated response
 * @param {Object} res - Express response object
 * @param {Object} options - Response options
 * @param {Array} options.data - Data array
 * @param {number} options.page - Current page
 * @param {number} options.limit - Items per page
 * @param {number} options.total - Total items count
 */
const sendPaginated = (res, { data, page, limit, total }) => {
  return sendSuccess(res, {
    data,
    pagination: {
      current: Number(page),
      pages: Math.ceil(total / limit),
      total,
      limit: Number(limit),
    },
  });
};

/**
 * Handle validation errors from express-validator
 * @param {Object} res - Express response object
 * @param {Object} validationResult - Result from express-validator
 * @returns {boolean|Object} - Returns false if no errors, otherwise sends error response
 */
const handleValidationErrors = (res, validationResult) => {
  if (!validationResult.isEmpty()) {
    return sendBadRequest(res, 'بيانات غير صالحة', validationResult.array());
  }
  return false;
};

module.exports = {
  sendSuccess,
  sendError,
  sendBadRequest,
  sendUnauthorized,
  sendForbidden,
  sendNotFound,
  sendServerError,
  sendCreated,
  sendPaginated,
  handleValidationErrors,
};
