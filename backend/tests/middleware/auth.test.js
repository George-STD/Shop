const jwt = require('jsonwebtoken');
const { protect, admin } = require('../../middleware/auth');
const User = require('../../models/User');

jest.mock('jsonwebtoken');
jest.mock('../../models/User');

describe('Auth Middleware', () => {
  let mockReq;
  let mockRes;
  let mockNext;

  beforeEach(() => {
    mockReq = {
      headers: {}
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    mockNext = jest.fn();
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('protect middleware', () => {
    it('should return 401 if no token is provided', async () => {
      await protect(mockReq, mockRes, mockNext);
      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({ success: false }));
    });

    it('should return 401 if token is invalid', async () => {
      mockReq.headers.authorization = 'Bearer invalidtoken';
      jwt.verify.mockImplementation(() => { throw new Error('Invalid token'); });
      
      await protect(mockReq, mockRes, mockNext);
      expect(mockRes.status).toHaveBeenCalledWith(401);
    });

    it('should return 401 if user is not found', async () => {
      mockReq.headers.authorization = 'Bearer validtoken';
      jwt.verify.mockReturnValue({ id: 'user1' });
      User.findById.mockReturnValue({ select: jest.fn().mockResolvedValue(null) });

      await protect(mockReq, mockRes, mockNext);
      expect(mockRes.status).toHaveBeenCalledWith(401);
    });

    it('should return 401 if user is inactive', async () => {
      mockReq.headers.authorization = 'Bearer validtoken';
      jwt.verify.mockReturnValue({ id: 'user1' });
      User.findById.mockReturnValue({
        select: jest.fn().mockResolvedValue({ _id: 'user1', isActive: false })
      });

      await protect(mockReq, mockRes, mockNext);
      expect(mockRes.status).toHaveBeenCalledWith(401);
    });

    it('should call next if valid user is authenticated', async () => {
      mockReq.headers.authorization = 'Bearer validtoken';
      jwt.verify.mockReturnValue({ id: 'user1' });
      User.findById.mockReturnValue({
        select: jest.fn().mockResolvedValue({ _id: 'user1', isActive: true })
      });

      await protect(mockReq, mockRes, mockNext);
      expect(mockNext).toHaveBeenCalled();
      expect(mockReq.user).toBeDefined();
    });
  });

  describe('admin middleware', () => {
    it('should return 403 if user is not admin', () => {
      mockReq.user = { role: 'customer' };
      admin(mockReq, mockRes, mockNext);
      expect(mockRes.status).toHaveBeenCalledWith(403);
    });

    it('should call next if user is admin', () => {
      mockReq.user = { role: 'admin' };
      admin(mockReq, mockRes, mockNext);
      expect(mockNext).toHaveBeenCalled();
    });
  });
});
