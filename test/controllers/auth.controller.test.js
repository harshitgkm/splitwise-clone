const {
  register,
  requestOtp,
  verifyOtp,
  login,
  logout,
} = require('../../src/controllers/auth.controller');
const {
  registerUser,
  validateOtp,
  requestOtpService,
  checkExistingUser,
  logoutUser,
} = require('../../src/services/auth.service');
const { redisClient } = require('../../src/config/redis');
const jwt = require('jsonwebtoken');
const { faker } = require('@faker-js/faker');

jest.mock('../../src/services/auth.service');
jest.mock('../../src/config/redis');
jest.mock('jsonwebtoken');

describe('Auth Controller Unit Tests', () => {
  const email = faker.internet.email();
  const username = faker.internet.userName();
  const otp = '123456';
  const token = jwt.sign({ email }, process.env.JWT_SECRET, {
    expiresIn: '20h',
  });

  beforeEach(() => {
    req = {
      headers: {
        authorization: 'Bearer mock-token',
      },
    };
    res = {
      json: jest.fn(),
    };

    jest.clearAllMocks();
  });

  it('should initiate registration and store user details in Redis', async () => {
    const req = { body: { username, email } };
    const res = { json: jest.fn() };

    redisClient.get.mockResolvedValue(null);

    await register(req, res);

    expect(redisClient.set).toHaveBeenCalledWith(
      `register:${email}`,
      JSON.stringify({ username, email }),
      { EX: 1800 },
    );
    expect(res.json).toHaveBeenCalledWith({
      message: 'OTP sent to your email for registration',
    });
  });

  it('should send OTP to existing user for login', async () => {
    const req = { body: { email } };
    const res = { json: jest.fn() };

    checkExistingUser.mockResolvedValue(true);

    await login(req, res);

    expect(requestOtpService).toHaveBeenCalledWith(email);
    expect(res.json).toHaveBeenCalledWith({
      message: 'OTP sent to your email for login',
    });
  });

  it('should return an error if the user does not exist', async () => {
    const req = { body: { email } };
    const res = { json: jest.fn() };

    checkExistingUser.mockResolvedValue(false);

    await login(req, res);

    expect(res.json).toHaveBeenCalledWith({
      message: 'This user does not exist in the DB',
    });
  });

  it('should request OTP if user is in the registration process', async () => {
    const req = { body: { email } };
    const res = { json: jest.fn() };

    redisClient.get.mockResolvedValue(JSON.stringify({ email }));

    await requestOtp(req, res);

    expect(requestOtpService).toHaveBeenCalledWith(email);
    expect(res.json).toHaveBeenCalledWith({
      message: 'OTP sent to your email for registration',
    });
  });

  it('should return an error if user details are not found in Redis', async () => {
    const req = {
      body: {
        email: 'testuser@example.com',
      },
    };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

    redisClient.get = jest.fn().mockResolvedValue(null);

    await requestOtp(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      message: 'User details not found. Please start the registration process.',
    });
  });

  it('should successfully verify OTP and complete registration', async () => {
    const req = { body: { email, otp } };
    const res = { json: jest.fn() };

    validateOtp.mockResolvedValue(true); // Simulate valid OTP
    redisClient.get.mockResolvedValue(JSON.stringify({ username, email }));

    registerUser.mockResolvedValue({ email, username });

    await verifyOtp(req, res);

    expect(validateOtp).toHaveBeenCalledWith(email, otp);
    expect(registerUser).toHaveBeenCalledWith(username, email);
    expect(redisClient.del).toHaveBeenCalledWith(`register:${email}`);
    expect(jwt.sign).toHaveBeenCalledWith({ email }, process.env.JWT_SECRET, {
      expiresIn: '20h',
    });
    expect(res.json).toHaveBeenCalledWith({
      message: 'Registration successful',
      token,
    });
  });

  it('should handle login flow if the user is not in Redis', async () => {
    const req = { body: { email, otp } };
    const res = { json: jest.fn() };

    validateOtp.mockResolvedValue(true);
    redisClient.get.mockResolvedValue(null);

    checkExistingUser.mockResolvedValue(true);
    await verifyOtp(req, res);

    expect(validateOtp).toHaveBeenCalledWith(email, otp);
    expect(checkExistingUser).toHaveBeenCalledWith(email);
    expect(jwt.sign).toHaveBeenCalledWith({ email }, process.env.JWT_SECRET, {
      expiresIn: '20h',
    });
    expect(res.json).toHaveBeenCalledWith({
      message: 'Login successful',
      token,
    });
  });

  it('should return an error if OTP is invalid', async () => {
    const req = {
      body: {
        email: 'testuser@example.com',
        otp: 'invalid-otp',
      },
    };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

    validateOtp.mockResolvedValue(false);

    await verifyOtp(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: 'Invalid OTP' });
  });
  it('should logout the user successfully', async () => {
    const token = 'mock-token';

    logoutUser.mockResolvedValue({ message: 'Logged out successfully' });

    await logout(req, res);

    expect(logoutUser).toHaveBeenCalledWith(token);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Logged out successfully',
    });
  });

  it('should logout successfully when token is provided', async () => {
    const req = {
      headers: {
        authorization: 'Bearer valid-jwt-token',
      },
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    await logout(req, res);

    expect(res.json).toHaveBeenCalledWith({
      message: 'Logged out successfully',
    });
  });
});
