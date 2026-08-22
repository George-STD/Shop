const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  entityType: {
    type: String,
    enum: ['Product', 'User', 'Order', 'Category', 'Occasion', 'System'],
    required: true
  },
  entityId: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'entityType'
  },
  entityName: {
    type: String,
  },
  action: {
    type: String,
    enum: ['CREATE', 'UPDATE', 'DELETE', 'STOCK_CHANGE', 'STATUS_CHANGE', 'BULK_UPDATE', 'ai_bulk_update'],
    required: true
  },
  adminId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  changes: {
    type: mongoose.Schema.Types.Mixed, // e.g. { stock: { old: 10, new: 5 } }
  },
  reason: {
    type: String, // Optional explanation
  }
}, {
  timestamps: true
});

// Index for faster queries & 365-day (1 year) automatic retention
auditLogSchema.index({ entityType: 1, action: 1, createdAt: -1 });
auditLogSchema.index({ entityId: 1, createdAt: -1 });
auditLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 365 * 24 * 60 * 60 });

module.exports = mongoose.model('AuditLog', auditLogSchema);
