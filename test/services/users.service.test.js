const {
  getUserById,
  updateUser,
  addFriendService,
  getFriends,
} = require('../../src/services/users.service');
const {
  User,
  FriendList,
  ExpenseSplit,
  Expense,
  Report,
} = require('../../src/models');
const {
  calculateOutstandingBalance,
  generateExpenseReportService,
  generatePDFAndUploadToS3,
} = require('../../src/services/users.service'); // Adjust path if needed
const { removeFriendService } = require('../../src/services/users.service.js'); // Adjust the path as needed
const Sequelize = require('sequelize');

jest.mock('../../src/models');
jest.mock('../../src/helpers/aws.helper.js', () => ({
  uploadFileToS3: jest.fn(),
}));

describe('User Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getUserById', () => {
    it('should fetch user by ID and exclude password', async () => {
      const mockUser = {
        id: '123',
        username: 'johndoe',
        email: 'johndoe@example.com',
        profile_picture_url: 'https://example.com/profile.jpg',
      };

      User.findByPk = jest.fn().mockResolvedValue(mockUser);

      const userId = '123';
      const result = await getUserById(userId);

      expect(User.findByPk).toHaveBeenCalledWith(userId, {
        attributes: { exclude: ['password'] },
      });
      expect(result).toEqual({
        id: '123',
        username: 'johndoe',
        email: 'johndoe@example.com',
        profile_picture_url: 'https://example.com/profile.jpg',
      });
    });

    it('should return null if user is not found', async () => {
      User.findByPk = jest.fn().mockResolvedValue(null);

      const userId = '999';
      const result = await getUserById(userId);

      expect(result).toBeNull();
    });
  });

  describe('updateUser', () => {
    it('should update user successfully', async () => {
      const updatedData = { username: 'john_doe_updated' };
      const mockUser = {
        id: '123',
        username: 'john_doe_updated',
        email: 'johndoe@example.com',
        profile_picture_url: 'https://example.com/profile.jpg',
      };

      User.update = jest.fn().mockResolvedValue([1]);
      User.findByPk = jest.fn().mockResolvedValue(mockUser);

      const userId = '123';
      const result = await updateUser(userId, updatedData);

      expect(result).toEqual({
        id: '123',
        username: 'john_doe_updated',
        email: 'johndoe@example.com',
        profile_picture_url: 'https://example.com/profile.jpg',
      });
    });

    it('should throw an error if the user does not exist', async () => {
      User.update = jest.fn().mockResolvedValue([0]);

      const updatedData = { username: 'john_doe_updated' };
      const userId = '999';

      await expect(updateUser(userId, updatedData)).rejects.toThrow(
        'User not found',
      );
    });

    it('should throw an error if update fails due to database error', async () => {
      User.update = jest.fn().mockRejectedValue(new Error('Database error'));

      const updatedData = { username: 'john_doe_updated' };
      const userId = '123';

      await expect(updateUser(userId, updatedData)).rejects.toThrow(
        'Database error',
      );
    });

    it('should validate email format on update', async () => {
      const updatedData = { email: 'invalidemail' };
      const userId = '123';

      await expect(updateUser(userId, updatedData)).rejects.toThrow(
        'Invalid email format',
      );
    });
  });

  describe('addFriendService', () => {
    it('should add a new friendship', async () => {
      const mockFriend = { username: 'janedoe' };
      const friend_one = '123';
      const friend_two = '456';

      FriendList.findOne = jest.fn().mockResolvedValue(null);
      User.findOne = jest.fn().mockResolvedValue(mockFriend);

      const result = await addFriendService(friend_one, friend_two);

      expect(FriendList.findOne).toHaveBeenCalled();
      expect(User.findOne).toHaveBeenCalledWith({
        where: { id: '456' }, // Correct the query field here
        attributes: ['username'],
      });
      expect(result).toEqual({
        message: 'Friendship created successfully with janedoe',
        friend: 'janedoe',
      });
    });
    it('should throw an error if friendship already exists', async () => {
      const friend_one = '123';
      const friend_two = '456';

      FriendList.findOne = jest.fn().mockResolvedValue(true);

      await expect(addFriendService(friend_one, friend_two)).rejects.toThrow(
        'Friendship already exists',
      );
    });

    it('should throw an error if friend not found', async () => {
      const friend_one = '123';
      const friend_two = '456';

      FriendList.findOne = jest.fn().mockResolvedValue(null);
      User.findOne = jest.fn().mockResolvedValue(null);

      await expect(addFriendService(friend_one, friend_two)).rejects.toThrow(
        'User with this username not found',
      );
    });

    it('should handle database errors when adding a friend', async () => {
      const friend_one = '123';
      const friend_two = '456';

      FriendList.findOne = jest
        .fn()
        .mockRejectedValue(new Error('Database error'));

      await expect(addFriendService(friend_one, friend_two)).rejects.toThrow(
        'User with this username not found',
      );
    });
  });

  describe('getFriends', () => {
    it('should return the list of friends for the user', async () => {
      const userId = '123';
      const mockFriends = [
        { friend_one: '123', friend_two: '456' },
        { friend_one: '123', friend_two: '789' },
      ];

      const mockFriendNames = ['janedoe', 'samsmith'];

      FriendList.findAll = jest.fn().mockResolvedValue(mockFriends);
      User.findOne = jest
        .fn()
        .mockResolvedValueOnce({ username: 'janedoe' })
        .mockResolvedValueOnce({ username: 'samsmith' });

      const result = await getFriends(userId);

      expect(FriendList.findAll).toHaveBeenCalledWith({
        where: expect.anything(),
        attributes: ['friend_one', 'friend_two'],
      });
      expect(result).toEqual(mockFriendNames);
    });

    it('should return an empty list if no friends are found', async () => {
      const userId = '123';

      FriendList.findAll = jest.fn().mockResolvedValue([]);
      const result = await getFriends(userId);

      expect(result).toEqual([]);
    });

    it('should throw an error if database query fails', async () => {
      const userId = '123';

      FriendList.findAll = jest
        .fn()
        .mockRejectedValue(new Error('Database error'));
      await expect(getFriends(userId)).rejects.toThrow('Database error');
    });
  });

  describe('removeFriendService', () => {
    beforeEach(() => {
      jest.clearAllMocks(); // Clear mocks before each test
    });

    it('should successfully remove a friendship if it exists', async () => {
      const mockFriendship = {
        id: 'friend-id',
        destroy: jest.fn().mockResolvedValue(), // Mock the destroy function
      };

      FriendList.findOne = jest.fn().mockResolvedValue(mockFriendship); // Mock findOne

      const friendId = 'friend-id';
      const userId = 'user-id';

      const result = await removeFriendService(friendId, userId);

      // Expectations
      expect(FriendList.findOne).toHaveBeenCalledWith({
        id: friendId,
        where: Sequelize.literal(
          `"friend_one" = CAST('${userId}' AS UUID) OR "friend_two" = CAST('${userId}' AS UUID)`,
        ),
      });
      expect(mockFriendship.destroy).toHaveBeenCalled(); // Ensure destroy was called
      expect(result).toBeUndefined(); // No return value on success
    });

    it('should return a message if the friendship does not exist', async () => {
      FriendList.findOne = jest.fn().mockResolvedValue(null); // Mock findOne returning no friendship

      const friendId = 'friend-id';
      const userId = 'user-id';

      const result = await removeFriendService(friendId, userId);

      // Expectations
      expect(FriendList.findOne).toHaveBeenCalledWith({
        id: friendId,
        where: Sequelize.literal(
          `"friend_one" = CAST('${userId}' AS UUID) OR "friend_two" = CAST('${userId}' AS UUID)`,
        ),
      });
      expect(result).toEqual({ message: 'Friendship not found' }); // Verify the message
    });

    it('should handle errors gracefully', async () => {
      FriendList.findOne = jest
        .fn()
        .mockRejectedValue(new Error('Database error')); // Simulate a database error

      const friendId = 'friend-id';
      const userId = 'user-id';

      await expect(removeFriendService(friendId, userId)).rejects.toThrow(
        'Database error',
      );

      // Ensure findOne was called before the error
      expect(FriendList.findOne).toHaveBeenCalledWith({
        id: friendId,
        where: Sequelize.literal(
          `"friend_one" = CAST('${userId}' AS UUID) OR "friend_two" = CAST('${userId}' AS UUID)`,
        ),
      });
    });
  });

  describe('generateExpenseReportService', () => {
    beforeEach(() => {
      jest.clearAllMocks(); // Clear mocks before each test
    });

    it('should generate an expense report successfully', async () => {
      // Mock totalPaid and totalOwed
      ExpenseSplit.findAll = jest
        .fn()
        .mockImplementationOnce(() =>
          Promise.resolve([{ totalPaid: '200.50' }]),
        )
        .mockImplementationOnce(() =>
          Promise.resolve([{ totalOwed: '150.25' }]),
        );

      // Mock payments data
      ExpenseSplit.findAll.mockImplementationOnce(() =>
        Promise.resolve([
          {
            amount_paid: 50,
            amount_owed: 25,
            created_at: '2024-11-01',
            Expense: {
              description: 'Lunch',
              amount: 100,
              created_at: '2024-11-01',
              Group: { name: 'Friends' },
            },
          },
        ]),
      );

      // Mock user expenses data
      Expense.findAll = jest.fn().mockResolvedValue([
        {
          id: 1,
          description: 'Dinner',
          amount: 200,
          created_at: '2024-11-02',
          Group: { name: 'Family' },
          expenseSplits: [
            { amount_paid: 100, amount_owed: 50, split_ratio: 0.5 },
          ],
        },
      ]);

      const userId = 'user-id';
      const result = await generateExpenseReportService(userId);

      expect(ExpenseSplit.findAll).toHaveBeenCalledTimes(3); // Called for totalPaid, totalOwed, and payments
      expect(Expense.findAll).toHaveBeenCalledTimes(1); // Called for user expenses

      expect(result).toEqual({
        totalPaid: 200.5,
        totalOwed: 150.25,
        paymentRecords: [
          {
            amountPaid: 50,
            amountOwed: 25,
            expenseDescription: 'Lunch',
            groupName: 'Friends',
            createdAt: '2024-11-01',
          },
        ],
        userExpenses: [
          {
            id: 1,
            description: 'Dinner',
            amount: 200,
            createdAt: '2024-11-02',
            groupName: 'Family',
            splits: [{ amountPaid: 100, amountOwed: 50, splitRatio: 0.5 }],
          },
        ],
      });
    });

    it('should handle empty data gracefully', async () => {
      // Mock empty totalPaid and totalOwed
      ExpenseSplit.findAll = jest
        .fn()
        .mockImplementationOnce(() => Promise.resolve([{ totalPaid: null }]))
        .mockImplementationOnce(() => Promise.resolve([{ totalOwed: null }]));

      // Mock no payments
      ExpenseSplit.findAll.mockImplementationOnce(() => Promise.resolve([]));

      // Mock no user expenses
      Expense.findAll = jest.fn().mockResolvedValue([]);

      const userId = 'user-id';
      const result = await generateExpenseReportService(userId);

      expect(result).toEqual({
        totalPaid: 0,
        totalOwed: 0,
        paymentRecords: [],
        userExpenses: [],
      });
    });

    it('should throw an error if fetching totalPaid fails', async () => {
      ExpenseSplit.findAll.mockRejectedValueOnce(new Error('Database error'));

      const userId = 'user-id';
      await expect(generateExpenseReportService(userId)).rejects.toThrow(
        'Failed to generate report data',
      );

      expect(ExpenseSplit.findAll).toHaveBeenCalledTimes(1);
    });

    it('should throw an error if fetching payments fails', async () => {
      // Mock totalPaid and totalOwed
      ExpenseSplit.findAll = jest
        .fn()
        .mockImplementationOnce(() =>
          Promise.resolve([{ totalPaid: '200.50' }]),
        )
        .mockImplementationOnce(() =>
          Promise.resolve([{ totalOwed: '150.25' }]),
        );

      // Mock payments error
      ExpenseSplit.findAll.mockImplementationOnce(() =>
        Promise.reject(new Error('Payments query failed')),
      );

      const userId = 'user-id';
      await expect(generateExpenseReportService(userId)).rejects.toThrow(
        'Failed to generate report data',
      );

      expect(ExpenseSplit.findAll).toHaveBeenCalledTimes(3);
    });

    it('should throw an error if fetching expenses fails', async () => {
      // Mock totalPaid and totalOwed
      ExpenseSplit.findAll = jest
        .fn()
        .mockImplementationOnce(() =>
          Promise.resolve([{ totalPaid: '200.50' }]),
        )
        .mockImplementationOnce(() =>
          Promise.resolve([{ totalOwed: '150.25' }]),
        );

      // Mock payments
      ExpenseSplit.findAll.mockImplementationOnce(() => Promise.resolve([]));

      // Mock expenses error
      Expense.findAll.mockRejectedValue(new Error('Expenses query failed'));

      const userId = 'user-id';
      await expect(generateExpenseReportService(userId)).rejects.toThrow(
        'Failed to generate report data',
      );

      expect(ExpenseSplit.findAll).toHaveBeenCalledTimes(3);
      expect(Expense.findAll).toHaveBeenCalledTimes(1);
    });
  });

  describe('getReportsService', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should return reports for the specified user and pagination parameters', async () => {
      const mockReports = [
        {
          id: 1,
          report_url: 'https://s3.amazonaws.com/report1.pdf',
          created_at: new Date(),
        },
        {
          id: 2,
          report_url: 'https://s3.amazonaws.com/report2.pdf',
          created_at: new Date(),
        },
      ];

      Report.findAll.mockResolvedValue(mockReports);

      const userId = 'user-id';
      const page = 1;
      const limit = 2;

      const result = await getReportsService(userId, page, limit);

      expect(Report.findAll).toHaveBeenCalledWith({
        where: { user_id: userId },
        order: [['created_at', 'DESC']],
        limit: limit,
        offset: 0, // For page 1, offset should be 0
      });

      expect(result).toEqual(mockReports);
    });

    it('should handle pagination by calculating the correct offset', async () => {
      const mockReports = [
        {
          id: 3,
          report_url: 'https://s3.amazonaws.com/report3.pdf',
          created_at: new Date(),
        },
      ];

      Report.findAll.mockResolvedValue(mockReports);

      const userId = 'user-id';
      const page = 2;
      const limit = 5;

      const result = await getReportsService(userId, page, limit);

      expect(Report.findAll).toHaveBeenCalledWith({
        where: { user_id: userId },
        order: [['created_at', 'DESC']],
        limit: limit,
        offset: 5, // For page 2, with limit 5, offset should be 5
      });

      expect(result).toEqual(mockReports);
    });

    it('should throw an error if no reports are found for the user', async () => {
      Report.findAll.mockResolvedValue([]);

      const userId = 'user-id';

      await expect(getReportsService(userId)).rejects.toThrow(
        'No reports found for this user',
      );

      expect(Report.findAll).toHaveBeenCalledWith({
        where: { user_id: userId },
        order: [['created_at', 'DESC']],
        limit: 10, // Default limit
        offset: 0, // Default offset for page 1
      });
    });

    it('should use default pagination parameters when page and limit are not provided', async () => {
      const mockReports = [
        {
          id: 4,
          report_url: 'https://s3.amazonaws.com/report4.pdf',
          created_at: new Date(),
        },
      ];

      Report.findAll.mockResolvedValue(mockReports);

      const userId = 'user-id';

      const result = await getReportsService(userId);

      expect(Report.findAll).toHaveBeenCalledWith({
        where: { user_id: userId },
        order: [['created_at', 'DESC']],
        limit: 10, // Default limit
        offset: 0, // Default offset for page 1
      });

      expect(result).toEqual(mockReports);
    });

    it('should throw an error if an exception occurs during the database query', async () => {
      Report.findAll.mockRejectedValue(new Error('Database query failed'));

      const userId = 'user-id';

      await expect(getReportsService(userId)).rejects.toThrow(
        'Database query failed',
      );
    });
  });

  describe('getReportsService', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should return reports for the specified user and pagination parameters', async () => {
      const mockReports = [
        {
          id: 1,
          report_url: 'https://s3.amazonaws.com/report1.pdf',
          created_at: new Date(),
        },
        {
          id: 2,
          report_url: 'https://s3.amazonaws.com/report2.pdf',
          created_at: new Date(),
        },
      ];

      Report.findAll.mockResolvedValue(mockReports);

      const userId = 'user-id';
      const page = 1;
      const limit = 2;

      const result = await getReportsService(userId, page, limit);

      expect(Report.findAll).toHaveBeenCalledWith({
        where: { user_id: userId },
        order: [['created_at', 'DESC']],
        limit: limit,
        offset: 0, // For page 1, offset should be 0
      });

      expect(result).toEqual(mockReports);
    });

    it('should handle pagination by calculating the correct offset', async () => {
      const mockReports = [
        {
          id: 3,
          report_url: 'https://s3.amazonaws.com/report3.pdf',
          created_at: new Date(),
        },
      ];

      Report.findAll.mockResolvedValue(mockReports);

      const userId = 'user-id';
      const page = 2;
      const limit = 5;

      const result = await getReportsService(userId, page, limit);

      expect(Report.findAll).toHaveBeenCalledWith({
        where: { user_id: userId },
        order: [['created_at', 'DESC']],
        limit: limit,
        offset: 5, // For page 2, with limit 5, offset should be 5
      });

      expect(result).toEqual(mockReports);
    });

    it('should throw an error if no reports are found for the user', async () => {
      Report.findAll.mockResolvedValue([]);

      const userId = 'user-id';

      await expect(getReportsService(userId)).rejects.toThrow(
        'No reports found for this user',
      );

      expect(Report.findAll).toHaveBeenCalledWith({
        where: { user_id: userId },
        order: [['created_at', 'DESC']],
        limit: 10, // Default limit
        offset: 0, // Default offset for page 1
      });
    });

    it('should use default pagination parameters when page and limit are not provided', async () => {
      const mockReports = [
        {
          id: 4,
          report_url: 'https://s3.amazonaws.com/report4.pdf',
          created_at: new Date(),
        },
      ];

      Report.findAll.mockResolvedValue(mockReports);

      const userId = 'user-id';

      const result = await getReportsService(userId);

      expect(Report.findAll).toHaveBeenCalledWith({
        where: { user_id: userId },
        order: [['created_at', 'DESC']],
        limit: 10, // Default limit
        offset: 0, // Default offset for page 1
      });

      expect(result).toEqual(mockReports);
    });

    it('should throw an error if an exception occurs during the database query', async () => {
      Report.findAll.mockRejectedValue(new Error('Database query failed'));

      const userId = 'user-id';

      await expect(getReportsService(userId)).rejects.toThrow(
        'Database query failed',
      );
    });
  });

  describe('calculateOutstandingBalance', () => {
    const userId = 'user-123'; // Example user ID for testing

    beforeEach(() => {
      jest.clearAllMocks(); // Clear mocks before each test
    });

    it('should calculate the outstanding balance correctly when user has expense splits', async () => {
      const mockExpenseSplits = [
        { user_id: userId, amount_owed: 100, amount_paid: 50 },
        { user_id: userId, amount_owed: 50, amount_paid: 20 },
      ];

      ExpenseSplit.findAll.mockResolvedValue(mockExpenseSplits);

      const result = await calculateOutstandingBalance(userId);

      expect(result).toBe(80);
      expect(ExpenseSplit.findAll).toHaveBeenCalledWith({
        where: { user_id: userId },
      });
    });

    it('should return 0 if the user has no expense splits', async () => {
      ExpenseSplit.findAll.mockResolvedValue([]);

      const result = await calculateOutstandingBalance(userId);

      expect(result).toBe(0);
      expect(ExpenseSplit.findAll).toHaveBeenCalledWith({
        where: { user_id: userId },
      });
    });

    it('should correctly handle negative and positive amounts in expense splits', async () => {
      const mockExpenseSplits = [
        { user_id: userId, amount_owed: 100, amount_paid: 150 },
        { user_id: userId, amount_owed: 50, amount_paid: 30 },
      ];

      ExpenseSplit.findAll.mockResolvedValue(mockExpenseSplits);

      const result = await calculateOutstandingBalance(userId);

      expect(result).toBe(-30);
      expect(ExpenseSplit.findAll).toHaveBeenCalledWith({
        where: { user_id: userId },
      });
    });
  });
});
