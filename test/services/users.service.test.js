const {
  getUserById,
  updateUser,
  calculateOutstandingBalance,
  addFriendService,
  getFriends,
  removeFriendService,
  getAllPaymentsService,
  generateExpenseReportService,
  generatePDFAndUploadToS3,
  getReportsService,
} = require('../../src/services/users.service.js');
const {
  User,
  FriendList,
  ExpenseSplit,
  Payment,
  Report,
  Group,
  Expense,
} = require('../../src/models');
const { uploadFileToS3 } = require('../../src/helpers/aws.helper.js');
const Sequelize = require('sequelize');
const { Op } = require('sequelize');

// Mocking external modules
jest.mock('../../src/helpers/aws.helper.js');
jest.mock('../../src/models');
jest.mock('sequelize');

jest.mock('../../src/helpers/aws.helper.js'); // Mock the aws helper module

describe('User Service Tests', () => {
  describe('getUserById', () => {
    it('should return user details excluding password', async () => {
      const mockUser = {
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
      };
      User.findByPk = jest.fn().mockResolvedValue(mockUser);

      const user = await getUserById(1);

      expect(User.findByPk).toHaveBeenCalledWith(1, {
        attributes: { exclude: ['password'] },
      });
      expect(user).toEqual(mockUser);
    });

    it('should return null if user does not exist', async () => {
      User.findByPk = jest.fn().mockResolvedValue(null);

      const user = await getUserById(1);

      expect(user).toBeNull();
    });
  });

  describe('updateUser', () => {
    it('should update user details and return updated user', async () => {
      const updatedData = { username: 'newusername' };
      const mockUser = { id: 1, username: 'newusername' };
      User.update = jest.fn().mockResolvedValue([1]);
      User.findByPk = jest.fn().mockResolvedValue(mockUser);

      const user = await updateUser(1, updatedData);

      expect(User.update).toHaveBeenCalledWith(updatedData, {
        where: { id: 1 },
      });
      expect(user.username).toBe('newusername');
    });
  });

  describe('calculateOutstandingBalance', () => {
    it('should calculate the outstanding balance for a user', async () => {
      const mockExpenseSplits = [
        { amount_owed: 50, amount_paid: 20 },
        { amount_owed: 30, amount_paid: 10 },
      ];
      ExpenseSplit.findAll = jest.fn().mockResolvedValue(mockExpenseSplits);

      const balance = await calculateOutstandingBalance(1);

      expect(balance).toBe(50);
    });

    it('should return 0 if there are no expense splits', async () => {
      ExpenseSplit.findAll = jest.fn().mockResolvedValue([]);

      const balance = await calculateOutstandingBalance(1);

      expect(balance).toBe(0);
    });
  });

  // describe('addFriendService', () => {
  //   it('should add a friend if not already friends', async () => {
  //     const mockFriend = { id: 2, username: 'frienduser' };
  //     const user_id = 1;
  //     User.findOne = jest.fn().mockResolvedValue(mockFriend);
  //     FriendList.findOne = jest.fn().mockResolvedValue(null);
  //     FriendList.create = jest.fn().mockResolvedValue(mockFriend);

  //     const response = await addFriendService(user_id, 'frienduser');

  //     expect(FriendList.create).toHaveBeenCalledWith({
  //       user_id: 1,
  //       friend_id: 2,
  //     });
  //     expect(response.message).toBe(
  //       'Friendship created successfully with frienduser',
  //     );
  //   });

  //   it('should throw error if user tries to add themselves as a friend', async () => {
  //     await expect(addFriendService(1, 'testuser')).rejects.toThrow(
  //       'You cannot add yourself as a friend',
  //     );
  //   });

  //   it('should throw error if friendship already exists', async () => {
  //     const mockFriend = { id: 2, username: 'frienduser' };
  //     User.findOne = jest.fn().mockResolvedValue(mockFriend);
  //     FriendList.findOne = jest.fn().mockResolvedValue(mockFriend);

  //     await expect(addFriendService(1, 'frienduser')).rejects.toThrow(
  //       'Friendship already exists',
  //     );
  //   });

  //   it('should throw error if user does not exist', async () => {
  //     User.findOne = jest.fn().mockResolvedValue(null);

  //     await expect(addFriendService(1, 'nonexistentuser')).rejects.toThrow(
  //       'User with this username not found',
  //     );
  //   });
  // });

  describe('addFriendService', () => {
    it('should add a friend if not already friends', async () => {
      const user_id = 1;
      const friend_username = 'frienduser';
      const mockFriend = { id: 2, username: friend_username };

      User.findOne = jest.fn().mockResolvedValue(mockFriend);
      FriendList.findOne = jest.fn().mockResolvedValue(null);
      FriendList.create = jest.fn().mockResolvedValue(mockFriend);

      const response = await addFriendService(user_id, friend_username);

      expect(FriendList.create).toHaveBeenCalledWith({
        user_id: 1,
        friend_id: 2,
      });
      expect(response.message).toBe(
        'Friendship created successfully with frienduser',
      );
    });

    it('should throw an error if user tries to add themselves as a friend', async () => {
      const user_id = 1;
      const friend_username = 'selfuser';
      const mockFriend = { id: 1, username: friend_username };

      User.findOne = jest.fn().mockResolvedValue(mockFriend);

      await expect(addFriendService(user_id, friend_username)).rejects.toThrow(
        'You cannot add yourself as a friend',
      );
    });

    it('should throw an error if the friendship already exists', async () => {
      const user_id = 1;
      const friend_username = 'frienduser';
      const mockFriend = { id: 2, username: friend_username };

      User.findOne = jest.fn().mockResolvedValue(mockFriend);
      FriendList.findOne = jest.fn().mockResolvedValue({
        user_id,
        friend_id: mockFriend.id,
      });

      await expect(addFriendService(user_id, friend_username)).rejects.toThrow(
        'Friendship already exists',
      );
    });

    it('should throw an error if user does not exist', async () => {
      User.findOne = jest.fn().mockResolvedValue(null);

      await expect(addFriendService(1, 'nonexistentuser')).rejects.toThrow(
        'User with this username not found',
      );
    });
  });

  describe('getFriends', () => {
    it('should return a list of friends with owed amounts', async () => {
      const mockFriends = [
        { user_id: 1, friend_id: 2 },
        { user_id: 2, friend_id: 1 },
      ];
      const mockFriendUser = { username: 'frienduser' };
      const mockAmountOwed = 100;
      FriendList.findAll = jest.fn().mockResolvedValue(mockFriends);
      User.findOne = jest.fn().mockResolvedValue(mockFriendUser);
      ExpenseSplit.sum = jest.fn().mockResolvedValue(mockAmountOwed);

      const friends = await getFriends(1);

      expect(friends.length).toBe(2);
      expect(friends[0].username).toBe('frienduser');
      expect(friends[0].amountOwed).toBe(100);
    });
  });

  describe('removeFriendService', () => {
    it('should remove a friend if friendship exists', async () => {
      const mockFriendship = { destroy: jest.fn() };
      FriendList.findOne = jest.fn().mockResolvedValue(mockFriendship);

      await removeFriendService(2, 1);

      expect(mockFriendship.destroy).toHaveBeenCalled();
    });

    it('should throw error if friendship does not exist', async () => {
      FriendList.findOne = jest.fn().mockResolvedValue(null);

      await expect(removeFriendService(2, 1)).rejects.toThrow(
        'Friendship does not exists',
      );
    });
  });

  describe('getAllPaymentsService', () => {
    it('should return all payments for a user', async () => {
      const mockPayments = [{ payer_id: 1, payee_id: 2, amount: 100 }];
      const mockTotalPaid = { totalPaid: 200 };
      const mockTotalOwed = { totalOwed: 300 };
      Payment.findAndCountAll = jest
        .fn()
        .mockResolvedValue({ count: 1, rows: mockPayments });
      ExpenseSplit.findOne = jest.fn().mockResolvedValue(mockTotalPaid);

      const payments = await getAllPaymentsService(1);
    });
  });

  describe('generateExpenseReportService', () => {
    it('should return a paginated list of expenses', async () => {
      const mockExpenses = [{ description: 'Dinner', amount: 50 }];
      Expense.findAndCountAll = jest
        .fn()
        .mockResolvedValue({ count: 1, rows: mockExpenses });

      const report = await generateExpenseReportService(1);

      expect(report.userExpenses.data.length).toBe(1);
      expect(report.userExpenses.data[0].description).toBe('Dinner');
    });
  });

  describe('generatePDFAndUploadToS3', () => {
    it('should generate and upload a PDF report to S3', async () => {
      const mockS3Url = 'https://s3.amazonaws.com/folder/expense-report.pdf';
      const mockReportData = {
        userExpenses: { data: [] },
        totalPaid: 100,
        totalOwed: 50,
      };
      const mockPaymentData = {
        totalPaidResult: { totalPaid: 100 },
        totalOwedResult: { totalOwed: 50 },
        payments: [],
      };

      const pdfUrl = await generatePDFAndUploadToS3(1);

      expect(uploadFileToS3).toHaveBeenCalled();
    });
  });

  describe('getReportsService', () => {
    it('should return a list of reports for the user', async () => {
      const mockReports = [{ id: 1, report_url: 'https://report-url.com' }];
      Report.findAll = jest.fn().mockResolvedValue(mockReports);

      const reports = await getReportsService(1);

      expect(reports.length).toBe(1);
      expect(reports[0].report_url).toBe('https://report-url.com');
    });

    it('should throw error if no reports are found for the user', async () => {
      Report.findAll = jest.fn().mockResolvedValue([]);

      await expect(getReportsService(1)).rejects.toThrow(
        'No reports found for this user',
      );
    });
  });
});
