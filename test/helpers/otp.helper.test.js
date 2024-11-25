const {
  generateOtp,
  saveOtp,
  verifyOtp,
} = require('../../src/helpers/otp.helper');
const { redisClient } = require('../../src/config/redis.js');

jest.mock('../../src/config/redis.js', () => ({
  redisClient: {
    set: jest.fn(),
    get: jest.fn(),
    del: jest.fn(),
  },
}));

describe('OTP Helper', () => {
  const mockEmail = 'test@example.com';
  const mockOtp = '123456';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('generateOtp', () => {
    it('should generate a 6-character OTP (not necessarily numeric)', () => {
      const otp = generateOtp();
      expect(otp).toHaveLength(6);
      expect(/^[a-f0-9]{6}$/.test(otp)).toBe(true);
    });
  });

  describe('saveOtp', () => {
    it('should save OTP to Redis with an expiration time of 300 seconds', async () => {
      const mockOtp = '123456';
      redisClient.set.mockResolvedValueOnce('OK');

      await saveOtp(mockEmail, mockOtp);

      expect(redisClient.set).toHaveBeenCalledWith(mockEmail, mockOtp, {
        EX: 300,
      });
      expect(redisClient.set).toHaveBeenCalledWith(mockEmail, mockOtp, {
        EX: 300,
        NX: true,
      });
      expect(redisClient.set).toHaveBeenCalledTimes(2);
    });

    it('should handle errors when saving OTP', async () => {
      redisClient.set.mockRejectedValueOnce(new Error('Redis error'));

      await expect(saveOtp(mockEmail, mockOtp)).rejects.toThrow('Redis error');
    });
  });

  describe('verifyOtp', () => {
    it('should return true if OTP matches the saved OTP', async () => {
      redisClient.get.mockResolvedValueOnce(mockOtp);
      redisClient.del.mockResolvedValueOnce('OK');

      const isVerified = await verifyOtp(mockEmail, mockOtp);

      expect(isVerified).toBe(true);
      expect(redisClient.del).toHaveBeenCalledWith(mockEmail);
    });

    it('should return false if OTP does not match the saved OTP', async () => {
      redisClient.get.mockResolvedValueOnce('654321');

      const isVerified = await verifyOtp(mockEmail, mockOtp);

      expect(isVerified).toBe(false);
      expect(redisClient.del).not.toHaveBeenCalled();
    });

    it('should handle errors when verifying OTP', async () => {
      redisClient.get.mockRejectedValueOnce(new Error('Redis error'));

      await expect(verifyOtp(mockEmail, mockOtp)).rejects.toThrow(
        'Redis error',
      );
    });
  });
});
