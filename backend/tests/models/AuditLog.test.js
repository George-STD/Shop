const mongoose = require('mongoose');
const AuditLog = require('../../models/AuditLog');

describe('AuditLog Model Test', () => {
  it('should create an audit log successfully', async () => {
    const log = new AuditLog({
      entityType: 'Product',
      entityId: new mongoose.Types.ObjectId(),
      entityName: 'Test Product',
      action: 'CREATE',
      adminId: new mongoose.Types.ObjectId(),
      changes: { stock: { old: 0, new: 10 } },
      reason: 'Initial creation'
    });

    const savedLog = await log.save();
    expect(savedLog._id).toBeDefined();
    expect(savedLog.entityType).toBe('Product');
    expect(savedLog.action).toBe('CREATE');
    expect(savedLog.adminId).toBeDefined();
    expect(savedLog.changes.stock.new).toBe(10);
  });

  it('should fail creation if required fields are missing', async () => {
    const log = new AuditLog({
      entityName: 'Test Product'
    });

    let err;
    try {
      await log.save();
    } catch (error) {
      err = error;
    }

    expect(err).toBeInstanceOf(mongoose.Error.ValidationError);
    expect(err.errors.entityType).toBeDefined();
    expect(err.errors.action).toBeDefined();
    expect(err.errors.adminId).toBeDefined();
  });

  it('should fail if entityType or action is invalid', async () => {
    const log = new AuditLog({
      entityType: 'InvalidEntity',
      action: 'INVALID_ACTION',
      adminId: new mongoose.Types.ObjectId()
    });

    let err;
    try {
      await log.save();
    } catch (error) {
      err = error;
    }

    expect(err).toBeInstanceOf(mongoose.Error.ValidationError);
    expect(err.errors.entityType).toBeDefined();
    expect(err.errors.action).toBeDefined();
  });
});
