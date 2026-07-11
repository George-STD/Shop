/**
 * Async handler wrapper to eliminate repetitive try/catch blocks.
 *
 * Usage:
 *   exports.getUsers = asyncHandler(async (req, res) => {
 *     // ... handler logic, no try/catch needed
 *   }, 'حدث خطأ أثناء جلب المستخدمين');
 *
 * @param {Function} fn - Async route handler (req, res, next)
 * @param {string}  [errorMessage] - Fallback message sent to the client on unhandled errors
 * @returns {Function} Express middleware
 */
const asyncHandler = (fn, errorMessage = 'حدث خطأ في الخادم') => {
  return async (req, res, next) => {
    try {
      await fn(req, res, next);
    } catch (error) {
      console.error(`[${req.method} ${req.originalUrl}]`, error);

      // If the controller already sent a response, bail out
      if (res.headersSent) return next(error);

      res.status(error.statusCode || 500).json({
        success: false,
        message: error.isClientError ? error.message : errorMessage,
        ...(error.errors ? { errors: error.errors } : {}),
      });
    }
  };
};

module.exports = asyncHandler;
