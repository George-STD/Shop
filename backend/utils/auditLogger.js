const AuditLog = require('../models/AuditLog');

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
