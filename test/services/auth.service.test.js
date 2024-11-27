const {
  generateToken,
  registerUser,
  checkExistingUser,
  requestOtpService,
  validateOtp,
  logoutUser,
} = require('../../src/services/auth.service');
const { User } = require('../../src/models');
const { redisClient } = require('../../src/config/redis');
const { sendOtpEmail } = require('../../src/helpers/mail.helper');
const {
  generateOtp,
  verifyOtp,
  saveOtp,
} = require('../../src/helpers/otp.helper');
const jwt = require('jsonwebtoken');
const { faker } = require('@faker-js/faker');

jest.mock('../../src/models');
jest.mock('../../src/config/redis');
jest.mock('../../src/helpers/mail.helper');
jest.mock('../../src/helpers/otp.helper');
jest.mock('jsonwebtoken');

jest.mock('../../src/helpers/mail.helper', () => ({
  sendOtpEmail: jest.fn(),
}));
jest.mock('../../src/helpers/otp.helper', () => ({
  generateOtp: jest.fn(),
  verifyOtp: jest.fn(),
  saveOtp: jest.fn(),
}));
describe('Auth Service', () => {
  let email;
  let username;
  let token;
  let otp;

  beforeEach(() => {
    email = faker.internet.email();
    username = faker.name.firstName();
    token = faker.string.uuid();
    otp = faker.number.int({ min: 1000, max: 9999 });

    jest.spyOn(User, 'findOne').mockResolvedValue(null);
    jest.spyOn(User.prototype, 'save').mockResolvedValue(true);
    generateOtp.mockReturnValue(otp);
    saveOtp.mockResolvedValue(true);
    verifyOtp.mockResolvedValue(true);
    jest.spyOn(redisClient, 'set').mockResolvedValue(true);
    jest.spyOn(jwt, 'sign').mockReturnValue(token);
    jest
      .spyOn(jwt, 'decode')
      .mockReturnValue({ exp: Math.floor(Date.now() / 1000) + 3600 });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('generateToken', () => {
    it('should generate a valid JWT token', () => {
      const expectedToken = 'fake-jwt-token';
      jwt.sign.mockReturnValue(expectedToken);

      const result = generateToken(email);
      expect(result).toBe(expectedToken);
      expect(jwt.sign).toHaveBeenCalledWith({ email }, process.env.JWT_SECRET, {
        expiresIn: '20h',
      });
    });
  });

  describe('registerUser', () => {
    it('should register a new user successfully', async () => {
      User.prototype.save.mockResolvedValue(true);

      const result = await registerUser(username, email);

      expect(result).toBe('User registered successfully');
      expect(User.prototype.save).toHaveBeenCalledWith();
    });

    it('should handle user registration failure', async () => {
      User.prototype.save.mockRejectedValue(new Error('Database error'));

      await expect(registerUser(username, email)).rejects.toThrow(
        'Database error',
      );
    });
  });

  describe('checkExistingUser', () => {
    it('should return true if user exists', async () => {
      User.findOne.mockResolvedValue({ email });

      const result = await checkExistingUser(email);

      expect(result).toBe(true);
      expect(User.findOne).toHaveBeenCalledWith({ where: { email } });
    });

    it('should return false if user does not exist', async () => {
      User.findOne.mockResolvedValue(null);

      const result = await checkExistingUser(email);

      expect(result).toBe(false);
    });
  });

  describe('requestOtpService', () => {
    it('should generate and send OTP', async () => {
      sendOtpEmail.mockResolvedValue(true);
      saveOtp.mockResolvedValue(true);

      await requestOtpService(email);

      expect(generateOtp).toHaveBeenCalled();
      expect(sendOtpEmail).toHaveBeenCalledWith(email, otp);
      expect(saveOtp).toHaveBeenCalledWith(email, otp);
    });

    it('should handle errors when sending OTP', async () => {
      sendOtpEmail.mockRejectedValue(new Error('Email send failed'));

      await expect(requestOtpService(email)).rejects.toThrow(
        'Email send failed',
      );
    });
  });

  describe('validateOtp', () => {
    it('should return true for valid OTP', async () => {
      verifyOtp.mockResolvedValue(true);

      const result = await validateOtp(email, otp);

      expect(result).toBe(true);
      expect(verifyOtp).toHaveBeenCalledWith(email, otp);
    });

    it('should return false for invalid OTP', async () => {
      verifyOtp.mockResolvedValue(false);

      const result = await validateOtp(email, otp);

      expect(result).toBe(false);
    });
  });

  describe('logoutUser', () => {
    it('should blacklist the token successfully', async () => {
      const decodedToken = { exp: Math.floor(Date.now() / 1000) + 3600 };
      jwt.decode.mockReturnValue(decodedToken);
      redisClient.set.mockResolvedValue(true);

      const result = await logoutUser(token);

      expect(result.success).toBe(true);
      expect(result.message).toBe(
        'Token blacklisted successfully, You are now logged out',
      );
      expect(redisClient.set).toHaveBeenCalledWith(token, 'blacklisted', {
        EX: decodedToken.exp - Math.floor(Date.now() / 1000),
      });
    });

    it('should throw error if token is invalid', async () => {
      jwt.decode.mockReturnValue(null);

      await expect(logoutUser(token)).rejects.toThrow('Failed to decode token');
    });

    it('should throw error if token is already expired', async () => {
      const decodedToken = { exp: Math.floor(Date.now() / 1000) - 3600 };
      jwt.decode.mockReturnValue(decodedToken);

      await expect(logoutUser(token)).rejects.toThrow(
        'Token is already expired',
      );
    });
  });
});
