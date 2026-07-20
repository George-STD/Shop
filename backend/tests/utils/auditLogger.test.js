const logAudit = require('../../utils/auditLogger');
const AuditLog = require('../../models/AuditLog');

describe('Audit Logger Utility Test', () => {
  let createSpy;

  beforeEach(() => {
    createSpy = jest.spyOn(AuditLog, 'create').mockImplementation(async () => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should call AuditLog.create with correct data', async () => {
    await logAudit({
      entityType: 'Product',
      entityId: '123',
      entityName: 'Test Product',
      action: 'create',
      adminId: 'admin_1',
      changes: { price: 100 },
      reason: 'Testing'
    });

    expect(createSpy).toHaveBeenCalledWith({
      entityType: 'Product',
      entityId: '123',
      entityName: 'Test Product',
      action: 'create',
      adminId: 'admin_1',
      changes: { price: 100 },
      reason: 'Testing'
    });
  });

  it('should handle errors gracefully without throwing', async () => {
    createSpy.mockImplementationOnce(() => Promise.reject(new Error('DB Error')));

    await expect(logAudit({
      entityType: 'Product',
      action: 'create',
    })).resolves.not.toThrow();

    expect(console.error).toHaveBeenCalledWith('AuditLog Error:', 'DB Error');
  });
});
