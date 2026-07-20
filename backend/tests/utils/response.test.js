const { sendSuccess, sendError } = require('../../utils/response');

describe('Response Utility Tests', () => {
  let mockRes;

  beforeEach(() => {
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
  });

  describe('sendSuccess', () => {
    it('should send standard success response', () => {
      sendSuccess(mockRes, { data: { id: 1 }, message: 'Success', statusCode: 200 });

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'Success',
        data: { id: 1 }
      });
    });

    it('should handle legacy parameters format', () => {
      sendSuccess(mockRes, { legacyData: true }, 'Legacy Message', 201);

      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'Legacy Message',
        data: { legacyData: true }
      });
    });

    it('should include pagination if provided', () => {
      const pagination = { current: 1, pages: 5, total: 50 };
      sendSuccess(mockRes, { data: [], pagination });

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: [],
        pagination
      });
    });
  });

  describe('sendError', () => {
    it('should send standard error response', () => {
      sendError(mockRes, 'Not Found', 404);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Not Found'
      });
    });

    it('should default to 500 status code', () => {
      sendError(mockRes, 'Internal Error');

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Internal Error'
      });
    });

    it('should handle object errors', () => {
      sendError(mockRes, { message: 'Object Error', statusCode: 400 });

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Object Error'
      });
    });
  });
});
