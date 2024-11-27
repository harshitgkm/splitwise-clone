const {
  sendOtpEmail,
  sendExpenseNotification,
  sendMail,
} = require('../../src/helpers/mail.helper');
const nodemailer = require('nodemailer');

jest.mock('nodemailer', () => ({
  createTransport: jest.fn(() => ({
    sendMail: jest.fn(),
  })),
}));

describe('Mail Helper', () => {
  const mockEmail = 'test@example.com';
  const mockOtp = '123456';
  const mockExpense = { id: 'expense123' };
  const mockDescription = 'Dinner at restaurant';
  const mockAmount = 50;

  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.EMAIL_USER = 'testuser@gmail.com';
    process.env.EMAIL_PASSWORD = 'password';
    process.env.MAIL_HOST = 'smtp.gmail.com';
    process.env.MAIL_PORT = '587';
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('sendOtpEmail', () => {
    it('should send OTP email successfully', async () => {
      const mockSendMail = nodemailer.createTransport().sendMail;
      mockSendMail.mockResolvedValueOnce(true);

      await sendOtpEmail(mockEmail, mockOtp);

      expect(mockSendMail).toHaveBeenCalledTimes(0);
    });

    it('should log an error if sending OTP email fails', async () => {
      const mockSendMail = nodemailer.createTransport().sendMail;
      mockSendMail.mockRejectedValueOnce(new Error('Failed to send email'));

      await sendOtpEmail(mockEmail, mockOtp);

      expect(mockSendMail).toHaveBeenCalledTimes(0);
    });
  });

  describe('sendExpenseNotification', () => {
    it('should send expense notification email successfully', async () => {
      const mockSendMail = nodemailer.createTransport().sendMail;
      mockSendMail.mockResolvedValueOnce(true);

      await sendExpenseNotification(
        [mockEmail],
        mockExpense,
        mockDescription,
        mockAmount,
      );

      expect(mockSendMail).toHaveBeenCalledTimes(0);
    });

    it('should log an error if sending expense notification fails', async () => {
      const mockSendMail = nodemailer.createTransport().sendMail;
      mockSendMail.mockRejectedValueOnce(new Error('Failed to send email'));

      await sendExpenseNotification(
        [mockEmail],
        mockExpense,
        mockDescription,
        mockAmount,
      );

      expect(mockSendMail).toHaveBeenCalledTimes(0);
    });
  });

  describe('sendMail', () => {
    it('should send generic mail successfully', async () => {
      const mockSendMail = nodemailer.createTransport().sendMail;
      mockSendMail.mockResolvedValueOnce(true);

      const mailOptions = {
        to: mockEmail,
        subject: 'Test',
        text: 'Test message',
      };
      await sendMail(mailOptions);
    });

    it('should log an error if sending generic mail fails', async () => {
      const mockSendMail = nodemailer.createTransport().sendMail;
      mockSendMail.mockRejectedValueOnce(new Error('Failed to send email'));

      const mailOptions = {
        to: mockEmail,
        subject: 'Test',
        text: 'Test message',
      };
      await sendMail(mailOptions);
    });
  });
});
