const asyncHandler = require('../../utils/asyncHandler');

describe('asyncHandler Utility Tests', () => {
  let mockReq;
  let mockRes;
  let mockNext;

  beforeEach(() => {
    mockReq = { method: 'GET', originalUrl: '/test' };
    mockRes = {
      headersSent: false,
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    mockNext = jest.fn();
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should call the wrapped function and succeed', async () => {
    const fn = jest.fn().mockResolvedValue('success');
    const wrapped = asyncHandler(fn);

    await wrapped(mockReq, mockRes, mockNext);

    expect(fn).toHaveBeenCalledWith(mockReq, mockRes, mockNext);
    expect(mockNext).not.toHaveBeenCalled();
    expect(mockRes.status).not.toHaveBeenCalled();
  });

  it('should catch errors and send 500 response by default', async () => {
    const fn = jest.fn().mockRejectedValue(new Error('Test Error'));
    const wrapped = asyncHandler(fn, 'Default Error Message');

    await wrapped(mockReq, mockRes, mockNext);

    expect(console.error).toHaveBeenCalled();
    expect(mockRes.status).toHaveBeenCalledWith(500);
    expect(mockRes.json).toHaveBeenCalledWith({
      success: false,
      message: 'Default Error Message'
    });
  });

  it('should send client error message if isClientError is true', async () => {
    const error = new Error('Client Error Msg');
    error.isClientError = true;
    error.statusCode = 400;

    const fn = jest.fn().mockRejectedValue(error);
    const wrapped = asyncHandler(fn);

    await wrapped(mockReq, mockRes, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith({
      success: false,
      message: 'Client Error Msg'
    });
  });

  it('should delegate to next if headers are already sent', async () => {
    mockRes.headersSent = true;
    const error = new Error('Late Error');

    const fn = jest.fn().mockRejectedValue(error);
    const wrapped = asyncHandler(fn);

    await wrapped(mockReq, mockRes, mockNext);

    expect(mockNext).toHaveBeenCalledWith(error);
    expect(mockRes.status).not.toHaveBeenCalled();
  });
});
