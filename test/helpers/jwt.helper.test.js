const jwt = require('jsonwebtoken');
const {
  generateInviteToken,
  verifyToken,
} = require('../../src/helpers/jwt.helper');

jest.mock('jsonwebtoken');

describe('JWT Helper', () => {
  const mockEnv = { JWT_SECRET: 'test_secret' };
  const mockGroupId = '12345';
  const mockEmail = 'test@example.com';
  const mockToken = 'mocked_token';
  const decodedPayload = { group_id: mockGroupId, email: mockEmail };

  beforeAll(() => {
    process.env.JWT_SECRET = mockEnv.JWT_SECRET;
  });

  afterAll(() => {
    delete process.env.JWT_SECRET;
  });

  describe('generateInviteToken', () => {
    it('should generate a token with the correct payload', () => {
      jwt.sign.mockReturnValue(mockToken); // Mock jwt.sign return value

      const token = generateInviteToken(mockGroupId, mockEmail);

      expect(jwt.sign).toHaveBeenCalledWith(
        { group_id: mockGroupId, email: mockEmail },
        process.env.JWT_SECRET,
        { expiresIn: '7d' },
      );
      expect(token).toBe(mockToken);
    });

    it('should throw an error if JWT_SECRET is missing', () => {
      delete process.env.JWT_SECRET;

      process.env.JWT_SECRET = mockEnv.JWT_SECRET;
    });
  });

  describe('verifyToken', () => {
    it('should return decoded payload for a valid token', () => {
      jwt.verify.mockReturnValue(decodedPayload);

      const result = verifyToken(mockToken);

      expect(jwt.verify).toHaveBeenCalledWith(
        mockToken,
        process.env.JWT_SECRET,
      );
      expect(result).toEqual(decodedPayload);
    });

    it('should throw an error for an invalid token', () => {
      jwt.verify.mockImplementation(() => {
        throw new Error('Invalid or expired token');
      });

      expect(() => verifyToken(mockToken)).toThrow('Invalid or expired token');
    });

    it('should throw an error if JWT_SECRET is missing', () => {
      delete process.env.JWT_SECRET;

      expect(() => verifyToken(mockToken)).toThrow('Invalid or expired token');

      process.env.JWT_SECRET = mockEnv.JWT_SECRET;
    });
  });
});
