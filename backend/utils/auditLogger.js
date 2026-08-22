const AuditLog = require('../models/AuditLog');

/**
 * Asynchronously persists an administrative audit log record.
 * Designed to fail gracefully without disrupting the parent HTTP request.
 *
 * @param {Object} params
 * @param {'Product'|'User'|'Order'|'Category'|'Occasion'|'System'} params.entityType - Target model collection
 * @param {import('mongoose').Types.ObjectId|string} [params.entityId] - Target document identifier
 * @param {string} [params.entityName] - Human-readable entity name
 * @param {'CREATE'|'UPDATE'|'DELETE'|'STOCK_CHANGE'|'STATUS_CHANGE'|'BULK_UPDATE'|'ai_bulk_update'} params.action - Action executed
 * @param {import('mongoose').Types.ObjectId|string} params.adminId - Performing administrator identifier
 * @param {Object} [params.changes] - Old vs new diff object
 * @param {string} [params.reason] - Justification or administrative note
 * @returns {Promise<void>}
 */
const logAudit = async ({ entityType, entityId, entityName, action, adminId, changes, reason }) => {
  try {
    await AuditLog.create({
      entityType,
      entityId,
      entityName,
      action,
      adminId,
      changes,
      reason
    });
  } catch (err) {
    console.error('AuditLog Error:', err.message);
  }
};

module.exports = logAudit;
module.exports.logAudit = logAudit;
module.exports.default = logAudit;
