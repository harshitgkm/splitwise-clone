jest.mock('../../src/models', () => ({
  Group: {
    findByPk: jest.fn(),
    getUsers: jest.fn(),
  },
  Expense: {
    create: jest.fn(),
    findByPk: jest.fn(),
    findOne: jest.fn(),
    destroy: jest.fn(),
    findAll: jest.fn(),
  },
  ExpenseSplit: {
    create: jest.fn(),
    bulkCreate: jest.fn(),
    destroy: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
  },
  User: {
    findByPk: jest.fn(),
  },
  Payment: {
    create: jest.fn(),
  },
  Comment: {
    create: jest.fn(),
    findAll: jest.fn(),
    findByPk: jest.fn(),
    destroy: jest.fn(),
  },
}));

jest.mock('../../src/helpers/mail.helper.js', () => ({
  sendExpenseNotification: jest.fn(),
}));

const {
  createExpenseService,
  getAllExpensesService,
  getExpenseDetailsService,
  updateExpenseService,
  deleteExpenseService,
  settleUpService,
  createCommentService,
  getCommentsService,
  updateCommentService,
  deleteCommentService,
} = require('../../src/services/expenses.service');

const {
  Group,
  Expense,
  ExpenseSplit,
  User,
  Payment,
  Comment,
} = require('../../src/models');
const { sendExpenseNotification } = require('../../src/helpers/mail.helper.js');

describe('Expense Service Tests', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createExpenseService', () => {
    let group, users;

    beforeEach(() => {
      group = {
        id: 1,
        getUsers: jest.fn(),
      };

      users = [
        { id: 1, email: 'user1@example.com' },
        { id: 2, email: 'user2@example.com' },
      ];

      Group.findByPk.mockResolvedValue(group);
      Expense.create.mockResolvedValue({
        id: 101,
        group_id: group.id,
        description: 'Test expense',
        amount: 100,
        split_type: 'EQUALLY',
      });

      sendExpenseNotification.mockResolvedValue(true);
    });

    afterEach(() => {
      jest.clearAllMocks();
    });

    test('should throw error if group not found', async () => {
      Group.findByPk.mockResolvedValue(null);

      await expect(
        createExpenseService(1, 100, 'Test expense', 'EQUALLY', []),
      ).rejects.toThrow('Group not found');
    });

    test('should create an expense with EQUALLY split type', async () => {
      group.getUsers.mockResolvedValue(users);
      ExpenseSplit.create.mockResolvedValue(true);

      const result = await createExpenseService(
        1,
        100,
        'Test expense',
        'EQUALLY',
        [{ userId: 1 }],
      );

      expect(Expense.create).toHaveBeenCalledWith({
        group_id: 1,
        description: 'Test expense',
        amount: 100,
        split_type: 'EQUALLY',
      });

      expect(ExpenseSplit.create).toHaveBeenCalledTimes(2);
      expect(sendExpenseNotification).toHaveBeenCalledWith(
        ['user1@example.com', 'user2@example.com'],
        expect.any(Object),
        'Test expense',
        100,
      );

      expect(result).toHaveProperty('id', 101);
    });

    test('should create an expense with PERCENTAGE split type', async () => {
      group.getUsers.mockResolvedValue(users);
      ExpenseSplit.create.mockResolvedValue(true);

      const result = await createExpenseService(
        1,
        100,
        'Test expense',
        'PERCENTAGE',
        [
          { userId: 1, percentage: 50 },
          { userId: 2, percentage: 50 },
        ],
      );

      expect(Expense.create).toHaveBeenCalledWith({
        group_id: 1,
        description: 'Test expense',
        amount: 100,
        split_type: 'PERCENTAGE',
      });

      expect(ExpenseSplit.create).toHaveBeenCalledTimes(2);
      expect(sendExpenseNotification).toHaveBeenCalledWith(
        ['user1@example.com', 'user2@example.com'],
        expect.any(Object),
        'Test expense',
        100,
      );

      expect(result).toHaveProperty('id', 101);
    });

    test('should throw error if negative percentage is provided in PERCENTAGE split type', async () => {
      await expect(
        createExpenseService(1, 100, 'Test expense', 'PERCENTAGE', [
          { userId: 1, percentage: -50 },
        ]),
      ).rejects.toThrow('Percentage cannot be negative.');
    });

    test('should create an expense with SHARES split type', async () => {
      group.getUsers.mockResolvedValue(users);
      ExpenseSplit.create.mockResolvedValue(true);

      const result = await createExpenseService(
        1,
        100,
        'Test expense',
        'SHARES',
        [
          { userId: 1, shares: 3 },
          { userId: 2, shares: 2 },
        ],
      );

      expect(Expense.create).toHaveBeenCalledWith({
        group_id: 1,
        description: 'Test expense',
        amount: 100,
        split_type: 'SHARES',
      });

      expect(ExpenseSplit.create).toHaveBeenCalledTimes(2);
      expect(sendExpenseNotification).toHaveBeenCalledWith(
        ['user1@example.com', 'user2@example.com'],
        expect.any(Object),
        'Test expense',
        100,
      );

      expect(result).toHaveProperty('id', 101);
    });

    test('should create an expense with UNEQUAL split type', async () => {
      group.getUsers.mockResolvedValue(users);
      ExpenseSplit.create.mockResolvedValue(true);

      const result = await createExpenseService(
        1,
        100,
        'Test expense',
        'UNEQUAL',
        [
          { userId: 1, amountPaid: 60 },
          { userId: 2, amountPaid: 40 },
        ],
      );

      expect(Expense.create).toHaveBeenCalledWith({
        group_id: 1,
        description: 'Test expense',
        amount: 100,
        split_type: 'UNEQUAL',
      });

      expect(ExpenseSplit.create).toHaveBeenCalledTimes(2);
      expect(sendExpenseNotification).toHaveBeenCalledWith(
        ['user1@example.com', 'user2@example.com'],
        expect.any(Object),
        'Test expense',
        100,
      );

      expect(result).toHaveProperty('id', 101);
    });

    test('should throw error if amountPaid is negative in UNEQUAL split type', async () => {
      await expect(
        createExpenseService(1, 100, 'Test expense', 'UNEQUAL', [
          { userId: 1, amountPaid: -10 },
        ]),
      ).rejects.toThrow('Amount paid cannot be negative.');
    });

    test('should throw error if invalid split type is provided', async () => {
      await expect(
        createExpenseService(1, 100, 'Test expense', 'INVALID', []),
      ).rejects.toThrow('Invalid split type');
    });
  });

  describe('getAllExpensesService', () => {
    it('should return all expenses for a group', async () => {
      const groupId = 1;
      const page = 1;
      const limit = 10;
      const expenses = [{ id: 1, description: 'Dinner', amount: 100 }];

      Expense.findAll.mockResolvedValue(expenses);

      const result = await getAllExpensesService(groupId, page, limit);

      expect(result).toEqual(expenses);
      expect(Expense.findAll).toHaveBeenCalledWith({
        where: { group_id: groupId },
        limit,
        offset: (page - 1) * limit,
      });
    });
  });

  describe('getExpenseDetailsService', () => {
    it('should return expense details', async () => {
      const expenseId = 1;
      const expenseDetails = {
        id: 1,
        description: 'Dinner',
        amount: 100,
        expenseSplits: [
          {
            user_id: 1,
            amount_paid: 50,
            amount_owed: 50,
            split_ratio: 50,
            user: { username: 'John' },
          },
        ],
        oweDetails: [{ payer: 'John', oweTo: 'Jane', amount: '50.00' }],
      };

      Expense.findOne.mockResolvedValue({
        id: 1,
        expenseSplits: [
          {
            user_id: 1,
            amount_paid: 50,
            amount_owed: 50,
            split_ratio: 50,
            user: { username: 'John' },
          },
        ],
      });
      ExpenseSplit.findOne.mockResolvedValue({});
      User.findByPk.mockResolvedValue({ username: 'John' });

      const result = await getExpenseDetailsService(expenseId);

      expect(result).toEqual();
    });

    it('should throw an error if the expense is not found', async () => {
      const expenseId = 999;

      Expense.findOne.mockResolvedValue(null);

      await expect(getExpenseDetailsService(expenseId)).rejects.toThrow(
        'Expense not found',
      );
    });
  });

  describe('updateExpenseService', () => {
    it('should throw an error if the expense is not found', async () => {
      const expenseId = 999;

      Expense.findByPk.mockResolvedValue(null);

      await expect(updateExpenseService({ expenseId })).rejects.toThrow(
        'Expense not found',
      );
    });
  });

  describe('deleteExpenseService', () => {
    it('should delete an expense', async () => {
      const expenseId = 1;
      const expense = { id: expenseId, destroy: jest.fn() };

      Expense.findOne.mockResolvedValue(expense);

      await deleteExpenseService(expenseId);

      expect(expense.destroy).toHaveBeenCalled();
    });

    it('should throw an error if the expense is not found', async () => {
      const expenseId = 999;

      Expense.findOne.mockResolvedValue(null);

      await expect(deleteExpenseService(expenseId)).rejects.toThrow(
        'Expense not found',
      );
    });
  });

  describe('settleUpService', () => {
    it('should settle up the amount between payer and payee', async () => {
      const payerId = 1;
      const payeeId = 2;
      const amount = 50;
      const expenseId = 1;

      ExpenseSplit.findOne.mockResolvedValueOnce({ amount_owed: 50 });
      ExpenseSplit.findOne.mockResolvedValueOnce({ amount_owed: 0 });
      ExpenseSplit.update.mockResolvedValue([1]);
      Payment.create.mockResolvedValue({ id: 1, amount });

      const result = await settleUpService(payerId, payeeId, amount, expenseId);

      expect(result.payment.amount).toBe(amount);
      expect(ExpenseSplit.update).toHaveBeenCalledTimes(2);
      expect(Payment.create).toHaveBeenCalled();
    });

    it('should throw an error if the amount to settle does not match', async () => {
      const payerId = 1;
      const payeeId = 2;
      const amount = 100;
      const expenseId = 1;

      ExpenseSplit.findOne.mockResolvedValueOnce({ amount_owed: 50 });

      await expect(
        settleUpService(payerId, payeeId, amount, expenseId),
      ).rejects.toThrow('The amount to settle must match the amount owed.');
    });
  });

  describe('createCommentService', () => {
    it('should create a comment', async () => {
      const expenseId = 1;
      const userId = 1;
      const comment = 'Nice dinner';
      const newComment = {
        id: 1,
        expense_id: expenseId,
        user_id: userId,
        comment,
        created_at: new Date(),
        updated_at: new Date(),
      };

      Comment.create.mockResolvedValue(newComment);
      User.findByPk.mockResolvedValue({
        username: 'John',
        profile_picture_url: 'url',
      });

      const result = await createCommentService(expenseId, userId, comment);

      expect(result.comment).toBe(comment);
      expect(Comment.create).toHaveBeenCalled();
    });
  });

  describe('getCommentsService', () => {
    it('should return all comments for an expense', async () => {
      const expenseId = 1;
      const comments = [
        {
          id: 1,
          expense_id: expenseId,
          user_id: 1,
          comment: 'Nice dinner',
          created_at: new Date(),
          updated_at: new Date(),
        },
      ];

      Comment.findAll.mockResolvedValue(comments);

      const result = await getCommentsService(expenseId);

      expect(result).toEqual(comments);
    });
  });

  describe('updateCommentService', () => {
    afterEach(() => {
      jest.clearAllMocks();
    });

    test('should throw an error if the comment is not found', async () => {
      Comment.findByPk.mockResolvedValue(null);

      await expect(
        updateCommentService(1, 'Updated comment text'),
      ).rejects.toThrow('Comment not found');

      expect(Comment.findByPk).toHaveBeenCalledWith(1, {
        include: [
          {
            model: User,
            attributes: ['username', 'profile_picture_url'],
          },
        ],
      });
    });

    test('should update the comment and return updated details', async () => {
      const mockComment = {
        id: 1,
        expense_id: 101,
        user_id: 202,
        comment: 'Old comment',
        created_at: new Date('2024-01-01'),
        updated_at: new Date('2024-01-01'),
        User: {
          username: 'Test User',
          profile_picture_url: 'https://example.com/profile.jpg',
        },
        save: jest.fn().mockResolvedValue(),
      };
      Comment.findByPk.mockResolvedValue(mockComment);

      const result = await updateCommentService(1, 'Updated comment text');

      expect(Comment.findByPk).toHaveBeenCalledWith(1, {
        include: [
          {
            model: User,
            attributes: ['username', 'profile_picture_url'],
          },
        ],
      });
      expect(mockComment.comment).toBe('Updated comment text');
      expect(mockComment.save).toHaveBeenCalled();

      expect(result).toEqual({
        id: 1,
        expenseId: 101,
        userId: 202,
        comment: 'Updated comment text',
        createdAt: mockComment.created_at,
        updatedAt: mockComment.updated_at,
        user: {
          username: 'Test User',
          profilePicture: 'https://example.com/profile.jpg',
        },
      });
    });

    test('should propagate errors from database operations', async () => {
      const errorMessage = 'Database error';
      Comment.findByPk.mockRejectedValue(new Error(errorMessage));

      await expect(
        updateCommentService(1, 'Updated comment text'),
      ).rejects.toThrow(errorMessage);

      expect(Comment.findByPk).toHaveBeenCalledWith(1, {
        include: [
          {
            model: User,
            attributes: ['username', 'profile_picture_url'],
          },
        ],
      });
    });
  });

  describe('deleteCommentService', () => {
    it('should delete a comment', async () => {
      const commentId = 1;
      const comment = { id: commentId, destroy: jest.fn() };

      Comment.findByPk.mockResolvedValue(comment);

      await deleteCommentService(commentId);

      expect(comment.destroy).toHaveBeenCalled();
    });

    it('should throw an error if the comment is not found', async () => {
      const commentId = 999;

      Comment.findByPk.mockResolvedValue(null);

      await expect(deleteCommentService(commentId)).rejects.toThrow(
        'Comment not found',
      );
    });
  });

  describe('updateExpenseService', () => {
    const mockExpense = {
      id: 'expenseId',
      group_id: 'groupId',
      description: 'Dinner',
      amount: 100,
      split_type: 'EQUALLY',
      save: jest.fn(),
    };

    const mockGroup = {
      id: 'groupId',
      getUsers: jest.fn(),
    };

    const mockUsers = [
      { id: 'user1', username: 'Alice' },
      { id: 'user2', username: 'Bob' },
    ];

    afterEach(() => {
      jest.clearAllMocks();
    });

    it('should update an expense and split it equally', async () => {
      Expense.findByPk.mockResolvedValue(mockExpense);
      Group.findByPk.mockResolvedValue(mockGroup);
      mockGroup.getUsers.mockResolvedValue(mockUsers);

      const params = {
        expenseId: 'expenseId',
        description: 'New Description',
        amount: 200,
        split_type: 'EQUALLY',
        users: [{ userId: 'user1' }, { userId: 'user2' }],
      };

      const result = await updateExpenseService(params);

      expect(Expense.findByPk).toHaveBeenCalledWith('expenseId');
      expect(mockExpense.save).toHaveBeenCalled();
      expect(ExpenseSplit.destroy).toHaveBeenCalledWith({
        where: { expense_id: 'expenseId' },
      });
      expect(ExpenseSplit.bulkCreate).toHaveBeenCalled();
      expect(result).toEqual(mockExpense);
    });

    it('should update an expense and split it by percentage', async () => {
      Expense.findByPk.mockResolvedValue(mockExpense);
      Group.findByPk.mockResolvedValue(mockGroup);
      mockGroup.getUsers.mockResolvedValue(mockUsers);

      const params = {
        expenseId: 'expenseId',
        amount: 200,
        split_type: 'PERCENTAGE',
        users: [
          { userId: 'user1', percentage: 70 },
          { userId: 'user2', percentage: 30 },
        ],
      };

      const result = await updateExpenseService(params);

      expect(Expense.findByPk).toHaveBeenCalledWith('expenseId');
      expect(mockExpense.save).toHaveBeenCalled();
      expect(ExpenseSplit.destroy).toHaveBeenCalledWith({
        where: { expense_id: 'expenseId' },
      });
      expect(ExpenseSplit.bulkCreate).toHaveBeenCalled();
      expect(result).toEqual(mockExpense);
    });

    it('should update an expense and split it by shares', async () => {
      Expense.findByPk.mockResolvedValue(mockExpense);
      Group.findByPk.mockResolvedValue(mockGroup);
      mockGroup.getUsers.mockResolvedValue(mockUsers);

      const params = {
        expenseId: 'expenseId',
        amount: 300,
        split_type: 'SHARES',
        users: [
          { userId: 'user1', shares: 3 },
          { userId: 'user2', shares: 2 },
        ],
      };

      const result = await updateExpenseService(params);

      expect(Expense.findByPk).toHaveBeenCalledWith('expenseId');
      expect(mockExpense.save).toHaveBeenCalled();
      expect(ExpenseSplit.destroy).toHaveBeenCalledWith({
        where: { expense_id: 'expenseId' },
      });
      expect(ExpenseSplit.bulkCreate).toHaveBeenCalled();
      expect(result).toEqual(mockExpense);
    });

    it('should throw an error if the total percentage exceeds 100 in PERCENTAGE split type', async () => {
      Expense.findByPk.mockResolvedValue(mockExpense);

      const params = {
        expenseId: 'expenseId',
        amount: 300,
        split_type: 'PERCENTAGE',
        users: [
          { userId: 'user1', percentage: 110 },
          { userId: 'user2', percentage: 10 },
        ],
      };

      await expect(updateExpenseService(params)).rejects.toThrowError(
        'Percentage must be between 0 and 100.',
      );
    });

    it('should throw an error if no expense is found', async () => {
      Expense.findByPk.mockResolvedValue(null);

      const params = {
        expenseId: 'invalidExpenseId',
      };

      await expect(updateExpenseService(params)).rejects.toThrowError(
        'Expense not found',
      );
    });

    it('should throw an error if the total shares are less than or equal to zero in SHARES split type', async () => {
      Expense.findByPk.mockResolvedValue(mockExpense);

      const params = {
        expenseId: 'expenseId',
        amount: 300,
        split_type: 'SHARES',
        users: [
          { userId: 'user1', shares: 0 },
          { userId: 'user2', shares: 0 },
        ],
      };

      await expect(updateExpenseService(params)).rejects.toThrowError(
        'Total shares must be greater than zero.',
      );
    });

    it('should throw an error if the group is not found', async () => {
      Expense.findByPk.mockResolvedValue(mockExpense);
      Group.findByPk.mockResolvedValue(null);

      const params = {
        expenseId: 'expenseId',
        split_type: 'EQUALLY',
      };

      await expect(updateExpenseService(params)).rejects.toThrowError(
        'Group not found',
      );
    });

    it('should handle database errors and throw an error', async () => {
      Expense.findByPk.mockRejectedValue(new Error('Database error'));

      const params = {
        expenseId: 'expenseId',
      };

      await expect(updateExpenseService(params)).rejects.toThrowError(
        'Database error',
      );
    });
  });
});
